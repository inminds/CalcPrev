type Job = {
  label: string;
  task: () => Promise<void> | void;
  enqueuedAt: number;
};

const queue: Job[] = [];
let isProcessing = false;

function scheduleProcessing() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  setImmediate(async () => {
    try {
      while (queue.length > 0) {
        const job = queue.shift();
        if (!job) {
          continue;
        }

        const startedAt = Date.now();
        try {
          await Promise.resolve(job.task());
          const durationMs = Date.now() - startedAt;
          console.log(`[Job] ${job.label} completed in ${durationMs}ms`);
        } catch (error) {
          console.error(`[Job] ${job.label} failed`, error);
        }
      }
    } finally {
      isProcessing = false;
      if (queue.length > 0) {
        scheduleProcessing();
      }
    }
  });
}

export function enqueueJob(label: string, task: () => Promise<void> | void) {
  queue.push({ label, task, enqueuedAt: Date.now() });
  scheduleProcessing();
}
