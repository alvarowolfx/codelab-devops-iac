import * as fs from "fs";
import * as yaml from "yaml";

export interface VirtualMachineFleetStackConfig {
  students: string[];
  providers: string[];
  shardingMethod: "round-robin" | "hash" | "range";
  digitalOceanToken?: string;
  // @internal only used for testing
  __skipProjectAssociation?: boolean;
}

export const readConfig = (): VirtualMachineFleetStackConfig => {
  const config = fs.readFileSync("vars.yaml", "utf8");
  const configYaml = yaml.parse(config) as VirtualMachineFleetStackConfig;
  configYaml.shardingMethod ||= "round-robin";
  configYaml.digitalOceanToken ||= process.env.DO_TOKEN;
  return configYaml;
};
