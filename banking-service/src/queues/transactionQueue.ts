import { Queue } from "bullmq";
import { redisClient } from "../config/redis";
import { logger } from "../config/logger";

export interface TransactionJobData {
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  transactionId: string;
  immediate?: boolean;
  priority?: number;
}

export const transactionQueue = new Queue<TransactionJobData>(
  "transaction-processing",
  {
    connection: redisClient,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  },
);

export async function addTransactionJob(
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER",
  transactionId: string,
  options?: { immediate?: boolean; priority?: number },
) {
  await transactionQueue.add(type, {
    type,
    transactionId,
    immediate: options?.immediate,
    priority: options?.priority,
  });
  logger.info(`Added ${type} job to queue`, { transactionId });
}
