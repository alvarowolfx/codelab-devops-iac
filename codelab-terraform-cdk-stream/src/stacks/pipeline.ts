import { Construct } from "constructs";
import { TerraformStack } from "cdktf";

import { DockerProvider } from "@cdktf/provider-docker/lib/provider";
import { LocalProvider } from "@cdktf/provider-local/lib/provider";
import { PostgresqlProvider } from "@cdktf/provider-postgresql/lib/provider";
import { Database } from "@cdktf/provider-postgresql/lib/database";
import { Extension } from "@cdktf/provider-postgresql/lib/extension";
import { Grant } from "@cdktf/provider-postgresql/lib/grant";
import { Role } from "@cdktf/provider-postgresql/lib/role";
import {
  Pipeline,
  WebsocketInput,
  KafkaOutput,
  KafkaInput,
  SqlInsertOutput,
} from "../constructs/pipeline";
import { Network } from "@cdktf/provider-docker/lib/network";
import { Redpanda } from "../constructs/redpanda";
import { TimescaleDb } from "../constructs/timescaledb";

export interface PipelineStackConfig {
  pipelineUserPassword: string;
  postgresPassword: string;
  dbPort: number;
  network: Network;
  redpanda: Redpanda;
  db: TimescaleDb;
  bentoVersion: string;
}

export class PipelineStack extends TerraformStack {
  public readonly db: Database;
  public readonly pipelineUser: Role;

  constructor(scope: Construct, id: string, config: PipelineStackConfig) {
    super(scope, id);

    new DockerProvider(this, "docker", {
      host: "unix:///var/run/docker.sock",
    });

    new LocalProvider(this, "local", {});

    new PostgresqlProvider(this, "postgresql", {
      connectTimeout: 15,
      database: "postgres",
      host: "localhost",
      password: config.postgresPassword,
      port: config.dbPort,
      sslmode: "disable",
      username: "postgres",
    });

    this.db = new Database(this, "pipeline_db", {
      name: "pipeline",
    });
    new Extension(this, "timescaledb_extension", {
      database: this.db.name,
      name: "timescaledb",
      schema: "public",
    });
    this.pipelineUser = new Role(this, "pipeline_role", {
      login: true,
      name: "pipeline",
      password: config.pipelineUserPassword,
    });
    new Grant(this, "pipeline_role_grants", {
      database: this.db.name,
      objectType: "schema",
      privileges: ["ALL"],
      role: this.pipelineUser.name,
      schema: "public",
    });

    const kakfaTopic = "coinbase_input_messages";
    const kafkaAddresses = [`${config.redpanda.container.name}:9092`];
    const dbHost = config.db.container.name;
    const dbInternalPort = config.db.container.ports.get(0).internal;
    const dbConnectionString = `postgresql://${this.pipelineUser.name}:${config.pipelineUserPassword}@${dbHost}:${dbInternalPort}/${this.db.name}?sslmode=disable`;

    new Pipeline(this, "source_pipeline", {
      bentoVersion: config.bentoVersion,
      network: config.network,
      input: new WebsocketInput("coinbase_source", {
        url: "wss://ws-feed-public.sandbox.exchange.coinbase.com",
        openMessageType: "text",
        openMessage: {
          type: "subscribe",
          product_ids: ["ETH-BTC", "ETH-USD", "BTC-USD"],
          channels: ["level2", "heartbeat", "ticker"],
        },
      }),
      output: new KafkaOutput("coinbase_kafka_output", {
        addresses: kafkaAddresses,
        topic: kakfaTopic,
      }),
    });

    new Pipeline(this, "ingestor_pipeline", {
      bentoVersion: config.bentoVersion,
      network: config.network,
      input: new KafkaInput("coinbase_kafka_ingestion", {
        addresses: kafkaAddresses,
        topics: [kakfaTopic],
        consumerGroup: "timescaledb_ingestor",
      }),
      output: new SqlInsertOutput("coinbase_sql_output", {
        connectionString: dbConnectionString,
        tableName: "coinbase_events",
        driver: "postgres",
        initStatement: `CREATE TABLE IF NOT EXISTS coinbase_events (timestamp TIMESTAMPTZ, event_type TEXT, data JSONB);`,
        columns: ["timestamp", "event_type", "data"],
        argsMapping: `root = [this.time.or(now()),this.type,json().string()]`,
      }),
    });
  }
}
