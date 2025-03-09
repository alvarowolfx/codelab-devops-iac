import { Construct } from "constructs";
import { Container } from "@cdktf/provider-docker/lib/container";
import { Image } from "@cdktf/provider-docker/lib/image";
import { Network } from "@cdktf/provider-docker/lib/network";

interface GrafanaConfig {
  version: string;
  network: Network;
}

export class Grafana extends Construct {
    public readonly container: Container;

  constructor(scope: Construct, id: string, config: GrafanaConfig) {
    super(scope, id);

    const grafanaImage = new Image(this, "image", {
      keepLocally: false,
      name: `grafana/grafana:${config.version}`,
    });

    this.container = new Container(this, "container", {
      image: grafanaImage.imageId,
      logOpts: {
        "max-file": "5",
        "max-size": "10m",
      },
      mustRun: true,
      name: "grafana",
      networkMode: "bridge",
      networksAdvanced: [
        {
          name: config.network.name,
        },
      ],
      ports: [
        {
          external: 3000,
          internal: 3000,
        },
      ],
      publishAllPorts: true,
      restart: "always",
      volumes: [
        {
          containerPath: "/var/lib/grafana",
          hostPath: "${path.cwd}/grafana/data",
        },
      ],
    });
  }
}
