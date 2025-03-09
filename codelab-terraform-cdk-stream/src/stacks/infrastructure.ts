import { Construct } from "constructs";
import { TerraformOutput, TerraformStack } from "cdktf";
import { DockerProvider } from "@cdktf/provider-docker/lib/provider";
import { Network } from "@cdktf/provider-docker/lib/network";
import { Redpanda } from "../constructs/redpanda";
import { Grafana } from "../constructs/grafana";
import { TimescaleDb } from "../constructs/timescaledb";

export interface InfraestrureStackConfig {
    bentoVersion: string;
    dbPort: number;
    grafanaVersion: string;
    postgresPassword: string;
    redpandaVersion: string;
    timescaledbVersion: string;
  }
  
export class InfraestrureStack extends TerraformStack {
    public readonly network: Network;
    public readonly redpanda: Redpanda;
    public readonly db: TimescaleDb;

    constructor(scope: Construct, id: string, config: InfraestrureStackConfig) {
      super(scope, id);
  
      new DockerProvider(this, "docker", {
        host: "unix:///var/run/docker.sock",
      });
  
      this.network = new Network(this, "pipeline_network", {
        name: "pipeline_network",
      });
  
      this.redpanda = new Redpanda(this, "redpanda", {
        deployConsole: true,
        network: this.network,
        version: config.redpandaVersion,
      });
  
      const grafana = new Grafana(this, "grafana", {
        network: this.network,
        version: config.grafanaVersion,
      });
  
      this.db = new TimescaleDb(this, "timescaledb", {
        dbPort: config.dbPort,
        network: this.network,
        postgresPassword: config.postgresPassword,
        version: config.timescaledbVersion,
      });
  
      new TerraformOutput(this, "grafana_url", {
        value:
          `http://localhost:${grafana.container.ports.get(0).external}`,
      });
      if (this.redpanda.consoleContainer) {
        new TerraformOutput(this, "redpanda_console_url", {
          value:
            `http://localhost:${this.redpanda.consoleContainer.ports.get(0).external}`,
        });
      }
    }
  }
  