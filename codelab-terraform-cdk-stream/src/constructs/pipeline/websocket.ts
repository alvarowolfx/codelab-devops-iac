import { PipelineInput } from "./index";

interface WebsocketInputConfig {
    url: string;
    openMessageType: "text" | "binary";
    openMessage: Record<string, unknown>;
    autoReplayNacks?: boolean;
  }
  
  export class WebsocketInput implements PipelineInput {
    private readonly label: string;
    private readonly config: WebsocketInputConfig;
  
    constructor(label: string, config: WebsocketInputConfig) {
      this.label = label;
      this.config = config;
    }
  
    bentoConfig(): Record<string, unknown> {
      return {
        label: this.label,
        websocket: {
          url: this.config.url,
          open_message_type: this.config.openMessageType,
          // Terraform requires the open_message to be a string, so we need to wrap it in jsonencode twice
          open_message: "${jsonencode(jsonencode("+JSON.stringify(this.config.openMessage)+"))}",
          auto_replay_nacks: this.config.autoReplayNacks ?? true,
        },
      };
    }
  }