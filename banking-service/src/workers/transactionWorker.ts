import { Worker } from "bullmq";
import Redis from "ioredis";
import { redisClient } from "../config/redis";
import { AccountService } from "../services/accountService";
import { TransactionRepository } from "../repositories/transactionRepository";
import { BankingError } from "../types";
import { logger } from "../config/logger";
import { sendNotification } from "../services/notificationService";
import { Decimal } from "decimal.js";

export class TransactionWorker {
  private worker: Worker;

  constructor(
    private accountService: AccountService,
    private transactionRepo: TransactionRepository,
  ) {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    this.worker = new Worker(
      "transaction-processing",
      async (job) => this.processJob(job),
      {
        connection: redisClient,
        concurrency: 5,
        limiter: {
          max: 20,
          duration: 1000,
        },
      },
    );

    this.setupEventListeners();
  }

  private async processJob(job: any) {
    const { type, transactionId } = job.data;
    logger.info(`Processing ${type} transaction`, { transactionId });

    try {
      switch (type) {
        case "DEPOSIT":
          await this.processDeposit(transactionId);
          break;
        case "WITHDRAWAL":
          await this.processWithdrawal(transactionId);
          break;
        case "TRANSFER":
          await this.processTransfer(transactionId);
          break;
      }
      return { success: true };
    } catch (error) {
      logger.error(`Failed processing ${type} transaction`, {
        transactionId,
        error,
      });
      await this.transactionRepo.failTransaction(transactionId);
      throw error;
    }
  }

  private async processDeposit(transactionId: string) {
    const transaction =
      await this.transactionRepo.getTransactionWithAccounts(transactionId);

    if (!transaction?.toAccount || !transaction.toAccountId) {
      throw new BankingError(
        "Invalid deposit transaction",
        "INVALID_TRANSACTION",
      );
    }

    const newBalance = new Decimal(transaction.toAccount.balance).plus(
      transaction.amount,
    );

    await this.accountService.accountRepo.updateBalance(
      transaction.toAccountId,
      newBalance,
    );

    await this.transactionRepo.completeTransaction(transactionId);

    if (transaction.description?.includes("Initial")) {
      await sendNotification(
        transaction.toAccountId,
        `Deposit of ${transaction.amount} received`,
      );
    }
  }

  private async processWithdrawal(transactionId: string) {
    const transaction =
      await this.transactionRepo.getTransactionWithAccounts(transactionId);

    if (!transaction?.fromAccount || !transaction.fromAccountId) {
      throw new BankingError(
        "Invalid withdrawal transaction",
        "INVALID_TRANSACTION",
      );
    }

    const newBalance = new Decimal(transaction.fromAccount.balance).minus(
      transaction.amount,
    );

    await this.accountService.accountRepo.updateBalance(
      transaction.fromAccountId,
      newBalance,
    );

    await this.transactionRepo.completeTransaction(transactionId);

    await sendNotification(
      transaction.fromAccountId,
      `Withdrawal of ${transaction.amount} processed`,
    );
  }

  private async processTransfer(transactionId: string) {
    const transaction =
      await this.transactionRepo.getTransactionWithAccounts(transactionId);

    if (
      !transaction?.fromAccount ||
      !transaction?.toAccount ||
      !transaction.fromAccountId ||
      !transaction.toAccountId
    ) {
      throw new BankingError(
        "Invalid transfer transaction",
        "INVALID_TRANSACTION",
      );
    }

    const newFromBalance = new Decimal(transaction.fromAccount.balance).minus(
      transaction.amount,
    );
    const newToBalance = new Decimal(transaction.toAccount.balance).plus(
      transaction.amount,
    );

    await this.accountService.accountRepo.updateBalances([
      { id: transaction.fromAccountId, balance: newFromBalance },
      { id: transaction.toAccountId, balance: newToBalance },
    ]);

    await this.transactionRepo.completeTransaction(transactionId);

    await Promise.all([
      sendNotification(
        transaction.fromAccountId,
        `Transfer of ${transaction.amount} to ${transaction.toAccount.accountNumber}`,
      ),
      sendNotification(
        transaction.toAccountId,
        `Transfer of ${transaction.amount} from ${transaction.fromAccount.accountNumber}`,
      ),
    ]);
  }

  private setupEventListeners() {
    this.worker.on("completed", (job) => {
      logger.info(`Job ${job.id} completed`, { data: job.data });
    });

    this.worker.on("failed", (job, err) => {
      logger.error(`Job ${job?.id} failed`, {
        error: err,
        data: job?.data,
      });
    });

    this.worker.on("error", (err) => {
      logger.error("Worker error", { error: err });
    });
  }

  async close() {
    await this.worker.close();
  }
}
