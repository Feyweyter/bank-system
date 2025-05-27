import { Router } from "express";
import { AccountController } from "../controllers/accountController";
import { AccountRepository } from "../repositories/accountRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import { AccountService } from "../services/accountService";

const router = Router();
const accountRepo = new AccountRepository();
const transactionRepo = new TransactionRepository();
const accountService = new AccountService(accountRepo, transactionRepo);
const accountController = new AccountController(accountService);

// Account management
router.post(
  "/accounts",
  accountController.createAccount.bind(accountController),
);
router.get(
  "/accounts",
  accountController.getAllAccounts.bind(accountController),
);
router.get(
  "/accounts/:accountId/balance",
  accountController.getBalance.bind(accountController),
);

// Transactions
router.post(
  "/accounts/:accountId/deposit",
  accountController.deposit.bind(accountController),
);
router.post(
  "/accounts/:accountId/withdraw",
  accountController.withdraw.bind(accountController),
);
router.post("/transfer", accountController.transfer.bind(accountController));

export default router;
