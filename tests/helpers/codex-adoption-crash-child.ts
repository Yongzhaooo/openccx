import { openccxCoordinatorTransaction } from "../../src/codex/transition-state";

const payload = JSON.parse(process.env.OCCX_ADOPTION_CRASH_PAYLOAD ?? "{}") as {
  coordinatorPath: string;
  checkpoint: "temp-created" | "temp-committed" | "published";
};

openccxCoordinatorTransaction(payload.coordinatorPath, {
  direction: "apply",
  onCheckpoint(checkpoint) {
    if (checkpoint === payload.checkpoint) process.exit(86);
  },
});
