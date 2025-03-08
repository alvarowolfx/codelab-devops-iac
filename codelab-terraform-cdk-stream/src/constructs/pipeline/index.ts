import { Construct } from "constructs";
import * as yaml from "yaml";

import { Image } from "../../../.gen/providers/docker/image";
import { File } from "../../../.gen/providers/local/file";
import { Container } from "../../../.gen/providers/docker/container";
import { Network } from "../../../.gen/providers/docker/network";


export interface PipelineInput {
  bentoConfig(): Record<string, unknown>;
}

export interface PipelineOutput {
  bentoConfig(): Record<string, unknown>;
}

export interface PipelineConfig {
  bentoVersion: string;
  input: PipelineInput;
  output: PipelineOutput;
  network: Network;
}

export class Pipeline extends Construct {
  private readonly config: PipelineConfig;

  constructor(scope: Construct, id: string, config: PipelineConfig) {
    super(scope, id);

    this.config = config;

    const bentoImage = new Image(this, "bento_image", {
        keepLocally: false,
        name: `ghcr.io/warpstreamlabs/bento:${config.bentoVersion}`,
      });

      const hostConfigPath = "${path.cwd}/config/bento-"+id+".yaml";
    
      new File(this, "bento_config", {
        content: this.toYaml(),
        filename: hostConfigPath,
      });

      new Container(this, "pipeline", {
        image: bentoImage.imageId,
        logOpts: {
          "max-file": "5",
          "max-size": "10m",
        },
        mustRun: true,
        name: `bento-${id}`,
        networkMode: "bridge",
        networksAdvanced: [
          {
            name: this.config.network.name,
          },
        ],
        ports: [
          {
            internal: 8080,
          },
        ],
        publishAllPorts: true,
        restart: "always",
        volumes: [
          {
            containerPath: "/bento.yaml",
            hostPath:
              "${path.cwd}/config/bento-"+id+".yaml",
          },
        ],
      });
  }

  toYaml(): string {
    return yaml.stringify({
      input: this.config.input.bentoConfig(),
      output: this.config.output.bentoConfig(),
    }, {
        singleQuote: false,
    });
  }
}

export { WebsocketInput } from "./websocket";
export { KafkaInput, KafkaOutput } from "./kafka";
export { SqlInsertOutput } from "./sql";