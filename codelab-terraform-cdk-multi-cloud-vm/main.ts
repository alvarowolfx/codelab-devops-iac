import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";

import { GoogleProvider } from "./.gen/providers/google/provider";
import { DigitaloceanProvider } from "./.gen/providers/digitalocean/provider";

import { VirtualMachine } from "./src/vm";
import { readConfig, VirtualMachineFleetStackConfig } from "./src/config";
import { getShards } from "./src/sharding";

import * as dotenv from "dotenv";
dotenv.config();

export class VirtualMachineFleetStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    config: VirtualMachineFleetStackConfig
  ) {
    super(scope, id);

    const { students, providers, shardingMethod, digitalOceanToken } = config;
    
    new GoogleProvider(this, "google", {
      project: "mba-devops-colab",
      region: "us-central1",
      zone: "us-central1-c",
    });    

    new DigitaloceanProvider(this, "digitalocean", {
      token: digitalOceanToken,
    });    

    const shardCount = providers.length;
    const shards = getShards(students, shardCount, shardingMethod);
    const providerShards = shards.reduce((acc, shard, index) => {
      acc[providers[index]] = shard;
      return acc;
    }, {} as Record<string, string[]>);
    // console.log("shards", providerShards);

    new TerraformOutput(this, "shards", {
      value: providerShards,
    });

    Object.entries(providerShards).forEach(([provider, students]) => {
      students.forEach((studentName) => {
        new VirtualMachine(this, `${studentName}-vm`, {
          provider: provider as "google" | "digitalocean",
          machineType: "small",
          tags: ["http-server", "https-server", `student-${studentName}`],
          diskSize: 10,
          os: "ubuntu",
          __skipProjectAssociation: config.__skipProjectAssociation,
        });
      });
    });
  }
}

const app = new App();
const config = readConfig();
new VirtualMachineFleetStack(app, "virtual-machine-fleet", config);
app.synth();
