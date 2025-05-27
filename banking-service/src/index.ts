import app from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { logger } from "./config/logger";
import { AccountRepository } from "./repositories/accountRepository";
import { TransactionRepository } from "./repositories/transactionRepository";
import { AccountService } from "./services/accountService";
import { TransactionWorker } from "./workers/transactionWorker";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    // Initialize services
    const accountRepo = new AccountRepository();
    const transactionRepo = new TransactionRepository();
    const accountService = new AccountService(accountRepo, transactionRepo);

    // Start worker
    const worker = new TransactionWorker(accountService, transactionRepo);
    worker.start();

    app.listen(PORT, () => {
      logger.info(`Banking service started on port ${PORT}`);
    });

    process.on("SIGTERM", async () => {
      logger.info("Shutting down gracefully...");
      await worker.close();
      await disconnectDatabase();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("Shutting down gracefully...");
      await worker.close();
      await disconnectDatabase();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

startServer();
