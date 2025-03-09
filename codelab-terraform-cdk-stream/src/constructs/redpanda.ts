import { Construct } from "constructs";
import { Container } from "@cdktf/provider-docker/lib/container";
import { Image } from "@cdktf/provider-docker/lib/image";
import { Network } from "@cdktf/provider-docker/lib/network";

interface RedpandaConfig {
  version: string;
  deployConsole: boolean;
  network: Network;
}

export class Redpanda extends Construct {
  public readonly container: Container;
  public readonly consoleContainer?: Container;

  constructor(scope: Construct, id: string, config: RedpandaConfig) {
    super(scope, id);

    const redpandaImage = new Image(this, "image", {
      keepLocally: false,
      name: `redpandadata/redpanda:${config.version}`,
    });

    const name = "redpanda";
    this.container = new Container(this, "node", {
      command: [
        "redpanda",
        "start",
        `--kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092`,
        `--advertise-kafka-addr internal://${name}:9092,external://localhost:19092`,
        `--pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082`,
        `--advertise-pandaproxy-addr internal://${name}:8082,external://localhost:18082`,
        `--schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081`,
        `--rpc-addr ${name}:33145`,
        `--advertise-rpc-addr ${name}:33145`,
        "--mode dev-container",
        "--smp 1",
        "--default-log-level=info",
      ],
      image: redpandaImage.imageId,
      logOpts: {
        "max-file": "5",
        "max-size": "10m",
      },
      mustRun: true,
      name,
      networkMode: "bridge",
      networksAdvanced: [
        {
          name: config.network.name,
        },
      ],
      ports: [
        {
          external: 18081,
          internal: 18081,
        },
        {
          external: 18082,
          internal: 18082,
        },
        {
          external: 19092,
          internal: 19092,
        },
        {
          external: 19644,
          internal: 9644,
        },
      ],
      publishAllPorts: true,
      restart: "always",
      volumes: [
        {
          containerPath: "/var/lib/redpanda/data",
          hostPath: "${path.cwd}/redpanda/data",
        },
      ],
    });

    if (config.deployConsole) {
      const consoleImage = new Image(this, "console_image", {
        keepLocally: false,
        name: `redpandadata/console:${config.version}`,
      });
      this.consoleContainer = new Container(this, "console", {
        env: [`KAFKA_BROKERS=${name}:9092`],
        image: consoleImage.imageId,
        logOpts: {
          "max-file": "5",
          "max-size": "10m",
        },
        mustRun: true,
        name: "redpanda_console",
        networkMode: "bridge",
        networksAdvanced: [
          {
            name: config.network.name,
          },
        ],
        ports: [
          {
            external: 9090,
            internal: 8080,
          },
        ],
        publishAllPorts: true,
        restart: "always",
      });
    }
  }
}
