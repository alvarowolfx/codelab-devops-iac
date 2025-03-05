import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";

import { ComputeInstance } from "../.gen/providers/google/compute-instance";
import { Droplet } from "../.gen/providers/digitalocean/droplet";
import { ProjectResources } from "../.gen/providers/digitalocean/project-resources";
import { DataDigitaloceanProject } from "../.gen/providers/digitalocean/data-digitalocean-project";

export interface VirtualMachineConfig {
    provider: "google" | "digitalocean";
    machineType: "small" | "medium" | "large";
    tags: string[];
    diskSize: number;
    os: "ubuntu" | "debian";
    // @internal only used for testing
    __skipProjectAssociation?: boolean;
  }
  
  const configMap = {
    google: {
      machineType: {
        small: "f1-micro",
        medium: "g1-small",
        large: "n1-standard-2",
      },
      os: {
        ubuntu:
          "projects/ubuntu-os-cloud/global/images/ubuntu-2410-oracular-amd64-v20250213",
        debian:
          "projects/ubuntu-os-cloud/global/images/debian-12-oracular-amd64-v20250213",
      },
      zone: "us-central1-c",
    },
    digitalocean: {
      machineType: {
        small: "s-1vcpu-512mb-10gb",
        medium: "s-1vcpu-1gb",
        large: "s-1vcpu-2gb",
      },
      zone: "nyc1",
      os: {
        ubuntu: "ubuntu-22-04-x64",
        debian: "debian-12-x64",
      },
    },
  };
  
  export class VirtualMachine extends Construct {
    constructor(scope: Construct, id: string, config: VirtualMachineConfig) {
      super(scope, id);

      if (config.provider === "google") {
        const vm = new ComputeInstance(scope, `${id}-instance`, {
          name: id,
          machineType: configMap.google.machineType[config.machineType],
          zone: configMap.google.zone,
          tags: config.tags,
          bootDisk: {
            autoDelete: true,
            mode: "READ_WRITE",
            initializeParams: {
              image: configMap.google.os[config.os],
              size: config.diskSize,
              type: "pd-balanced",
            },
          },
          networkInterface: [
            {
              network: "default",
              accessConfig: [{}],
            },
          ],
        });
        new TerraformOutput(scope, `${id}-public-ip`, {
          value: vm.networkInterface.get(0).accessConfig.get(0).natIp,
        });
      } else if (config.provider === "digitalocean") {
        const vm = new Droplet(scope, `${id}-droplet`, {
          name: id,
          size: configMap.digitalocean.machineType[config.machineType],
          image: configMap.digitalocean.os[config.os],
          region: configMap.digitalocean.zone,
          tags: config.tags,
          
        });
        if (!config.__skipProjectAssociation) {
          const project = new DataDigitaloceanProject(scope, `${id}-project`, {
            name: "mba-devops"
          });
          new ProjectResources(scope, `${id}-project-resources`, {
            project: project.id,
            resources: [vm.urn]
          });
        }

        new TerraformOutput(scope, `${id}-public-ip`, {
          value: vm.ipv4Address,
        });
      } else {
        throw new Error(`Provider ${config.provider} not supported`);
      }
    }
  }