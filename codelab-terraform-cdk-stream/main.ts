import {
  App,
} from "cdktf";

import { InfrastructureStack } from "./src/stacks/infrastructure";
import { PipelineStack } from "./src/stacks/pipeline";

const bentoVersion = "latest";
const dbPort = 5432;
const grafanaVersion = "latest";
const pipelineUserPassword = "anothersecret";
const postgresPassword = "supersecret";
const redpandaVersion = "latest";
const timescaledbVersion = "latest-pg15";

const app = new App();
const infra = new InfrastructureStack(app, "infra", {
  bentoVersion,
  dbPort,
  grafanaVersion,
  postgresPassword,
  redpandaVersion,
  timescaledbVersion,
});
new PipelineStack(app, "pipeline", {  
  dbPort,
  bentoVersion,
  postgresPassword,
  db: infra.db,
  network: infra.network,
  pipelineUserPassword,
  redpanda: infra.redpanda,
});
app.synth();
