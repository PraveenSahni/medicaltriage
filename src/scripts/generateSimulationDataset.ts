import {
  runSimulationSuite,
  simulationTrainingJsonl
} from "../services/simulationEngine.js";

const format = process.argv.includes("--jsonl") ? "jsonl" : "json";

if (format === "jsonl") {
  process.stdout.write(`${simulationTrainingJsonl()}\n`);
} else {
  process.stdout.write(
    `${JSON.stringify(
      {
        syntheticOnly: true,
        generatedAt: new Date().toISOString(),
        warning:
          "Synthetic simulation data only. Use for AI copilot evaluation, prompt tests, and governed training workflows.",
        results: runSimulationSuite()
      },
      null,
      2
    )}\n`
  );
}
