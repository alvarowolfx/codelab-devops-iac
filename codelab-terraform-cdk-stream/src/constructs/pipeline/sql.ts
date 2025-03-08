import { PipelineOutput } from ".";

interface SqlInsertOutputConfig {
    connectionString: string;
    driver: "postgres" | "mysql";
    tableName: string;
    initStatement: string;
    columns: string[];
    argsMapping: string;
  }
  
  export class SqlInsertOutput implements PipelineOutput {
    private readonly label: string;
    private readonly config: SqlInsertOutputConfig;
  
    constructor(label: string, config: SqlInsertOutputConfig) {
      this.label = label;
      this.config = config;
    }
  
    bentoConfig(): Record<string, unknown> {
      return {
        label: this.label,
        sql_insert: {
          driver: this.config.driver,
          dsn: this.config.connectionString,
          table: this.config.tableName,
          init_statement: this.config.initStatement.replaceAll("\n", ""),
          columns: this.config.columns,
          args_mapping: this.config.argsMapping.replaceAll("\n", ""),
        },
      };
    }
  }