import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { Testing } from "cdktf";
import { VirtualMachineFleetStack } from "../main";
import { GoogleProvider } from "../.gen/providers/google/provider";
import { DigitaloceanProvider } from "../.gen/providers/digitalocean/provider";
import { ComputeInstance } from "../.gen/providers/google/compute-instance";
import { Droplet } from "../.gen/providers/digitalocean/droplet";
import { VirtualMachine, VirtualMachineConfig } from "../src/vm";
import { TerraformConstructor } from "cdktf/lib/testing/matchers";
import { ProjectResources } from "../.gen/providers/digitalocean/project-resources";

describe("Virtual Machine Fleet Application", () => {
  describe("Providers", () => {
    it("should configure Google and DigitalOcean providers", () => {
      const app = Testing.app();
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students: ["a", "b"],
        providers: ["google", "digitalocean"],
        shardingMethod: "round-robin",
        digitalOceanToken: "1234567890",
      });
      const testApp = Testing.synth(stack);
      expect(testApp).toHaveProvider(GoogleProvider);
      expect(testApp).toHaveProviderWithProperties(DigitaloceanProvider, {
        token: "1234567890",
      });
    });

    it("should produce valid terraform and plan successfully", () => {
      const app = Testing.app();
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students: ["a", "b"],
        providers: ["google", "digitalocean"],
        shardingMethod: "round-robin",
        digitalOceanToken: "1234567890",
        __skipProjectAssociation: true,
      });
      const testApp = Testing.fullSynth(stack);
      expect(testApp).toBeValidTerraform();
      expect(testApp).toPlanSuccessfully();
    });
  });

  describe("Virtual Machine", () => {
    const baseConfig: VirtualMachineConfig = {
      provider: "digitalocean",
      diskSize: 10,
      machineType: "small",
      os: "ubuntu",
      tags: ["a", "b"],
    };

    it("should create a Compute Instance with the correct properties", () => {
      const vm = Testing.synthScope((scope) => {
        new VirtualMachine(scope, "test-vm", {
          ...baseConfig,
          provider: "google",
        });
      });
      expect(vm).toHaveResourceWithProperties(ComputeInstance, {
        name: "test-vm",
        boot_disk: {
          auto_delete: true,
          initialize_params: {
            image:
              "projects/ubuntu-os-cloud/global/images/ubuntu-2410-oracular-amd64-v20250213",
            size: 10,
            type: "pd-balanced",
          },
          mode: "READ_WRITE",
        },
        machine_type: "f1-micro",
        network_interface: [
          {
            access_config: [{}],
            network: "default",
          },
        ],
        tags: ["a", "b"],
        zone: "us-central1-c",
      });
    });

    it("should create a Droplet with the correct properties", () => {
      const vm = Testing.synthScope((scope) => {
        new VirtualMachine(scope, "test-vm", {
          ...baseConfig,
          provider: "digitalocean",
        });
      });
      expect(vm).toHaveResourceWithProperties(Droplet, {
        name: "test-vm",
        image: "ubuntu-22-04-x64",
        region: "nyc1",
        size: "s-1vcpu-512mb-10gb",
        tags: ["a", "b"],
      });
      expect(vm).toHaveResourceWithProperties(ProjectResources, {
        project: "${data.digitalocean_project.test-vm-project.id}",
        resources: ["${digitalocean_droplet.test-vm-droplet.urn}"],
      });
    });
  });

  describe("Resources", () => {
    it("with Google Provider, should create a Compute Engine Instance for each student", () => {
      const app = Testing.app();
      const students = ["a", "b", "c", "d", "e"];
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students,
        providers: ["google"],
        shardingMethod: "round-robin",
      });
      const testApp = Testing.synth(stack);
      expectToHaveResourcesWithProperties(
        testApp,
        ComputeInstance,
        students.map((student) => ({
          name: `${student}-vm`,
        }))
      );
    });

    it("with Digital Ocean Provider, should create a Droplet for each student", () => {
      const app = Testing.app();
      const students = ["a", "b"];
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students,
        providers: ["digitalocean"],
        shardingMethod: "round-robin",
      });
      const testApp = Testing.synth(stack);
      expectToHaveResourcesWithProperties(
        testApp,
        Droplet,
        students.map((student) => ({
          name: `${student}-vm`,
        }))
      );
    });
  });

  describe("Sharding", () => {
    it("should create Virtual Machines in a round-robin manner", () => {
      const app = Testing.app();
      const students = ["a", "b", "c", "d", "e"];
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students,
        providers: ["google", "digitalocean"],
        shardingMethod: "round-robin",
      });
      const testApp = Testing.synth(stack);
      expectToHaveResourcesWithProperties(
        testApp,
        ComputeInstance,
        ["a", "c", "e"].map((student) => ({
          name: `${student}-vm`,
        }))
      );
      expectToHaveResourcesWithProperties(
        testApp,
        Droplet,
        ["b", "d"].map((student) => ({
          name: `${student}-vm`,
        }))
      );
    });

    it("should create Virtual Machines in a range sharding manner", () => {
      const app = Testing.app();
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students: ["a", "b", "c", "d", "e"],
        providers: ["google", "digitalocean"],
        shardingMethod: "range",
      });
      const testApp = Testing.synth(stack);
      expectToHaveResourcesWithProperties(
        testApp,
        ComputeInstance,
        ["a", "b", "c"].map((student) => ({
          name: `${student}-vm`,
        }))
      );
      expectToHaveResourcesWithProperties(
        testApp,
        Droplet,
        ["d", "e"].map((student) => ({
          name: `${student}-vm`,
        }))
      );
    });

    it("should create Virtual Machines in a hash sharding manner", () => {
      const app = Testing.app();
      const stack = new VirtualMachineFleetStack(app, "test-fleet", {
        students: ["a", "b", "c", "d", "e"],
        providers: ["google", "digitalocean"],
        shardingMethod: "hash",
      });
      const testApp = Testing.synth(stack);
      expectToHaveResourcesWithProperties(
        testApp,
        ComputeInstance,
        ["b", "d"].map((student) => ({
          name: `${student}-vm`,
        }))
      );
      expectToHaveResourcesWithProperties(
        testApp,
        Droplet,
        ["a", "c", "e"].map((student) => ({
          name: `${student}-vm`,
        }))
      );
    });
  });
});

const expectToHaveResourcesWithProperties = (
  input: string,
  resourceConstructor: TerraformConstructor,
  properties: Record<string, any>[]
) => {
  properties.forEach((property) => {
    expect(input).toHaveResourceWithProperties(resourceConstructor, property);
  });
};
