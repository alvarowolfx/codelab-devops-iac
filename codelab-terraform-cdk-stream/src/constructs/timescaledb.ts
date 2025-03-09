import { Construct } from "constructs";
import { Container } from "@cdktf/provider-docker/lib/container";
import { Image } from "@cdktf/provider-docker/lib/image";
import { Network } from "@cdktf/provider-docker/lib/network";

interface TimescaleDbConfig {
  network: Network;
  postgresPassword: string;
  dbPort: number;
  version: string;
}

export class TimescaleDb extends Construct {
  public readonly container: Container;

  constructor(scope: Construct, id: string, config: TimescaleDbConfig) {
    super(scope, id);

    const timescaledbImage = new Image(this, "image", {
      keepLocally: false,
      name: `timescale/timescaledb:${config.version}`,
    });

    this.container = new Container(this, "container", {
      env: [`POSTGRES_PASSWORD=${config.postgresPassword}`],
      image: timescaledbImage.imageId,
      logOpts: {
        "max-file": "5",
        "max-size": "10m",
      },
      mustRun: true,
      name: "timescaledb",
      networkMode: "bridge",
      networksAdvanced: [
        {
          name: config.network.name,
        },
      ],
      ports: [
        {
          external: config.dbPort,
          internal: 5432,
        },
      ],
      publishAllPorts: true,
      restart: "always",
      volumes: [
        {
          containerPath: "/var/lib/postgresql/data",
          hostPath: "${path.cwd}/postgres/data",
        },
      ],
    });
  }
}
