import { PipelineInput } from ".";
import { PipelineOutput } from ".";

interface KafkaOutputConfig {
    addresses: string[];
    topic: string;
  }
  
  export class KafkaOutput implements PipelineOutput {
    private readonly label: string;
    private readonly config: KafkaOutputConfig;
  
    constructor(label: string, config: KafkaOutputConfig) {
      this.label = label;
      this.config = config;
    }
  
    bentoConfig(): Record<string, unknown> {
      return {
        label: this.label,
        kafka: {
          addresses: this.config.addresses,
          topic: this.config.topic,
        },
      };
    }
  }
  
  interface KafkaInputConfig {
    addresses: string[];
    topics: string[];
    consumerGroup: string;
  }
  
  export class KafkaInput implements PipelineInput {
    private readonly label: string;
    private readonly config: KafkaInputConfig;
  
    constructor(label: string, config: KafkaInputConfig) {
      this.label = label;
      this.config = config;
    }
  
    bentoConfig(): Record<string, unknown> {
      return {
        label: this.label,
        kafka: {
          addresses: this.config.addresses,
          topics: this.config.topics,
          consumer_group: this.config.consumerGroup,
        },
      };
    }
  }