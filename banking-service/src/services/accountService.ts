import { AccountRepository } from "../repositories/accountRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import {
  validateAmount,
  validateAccountId,
  validateHolderName,
} from "../utils/validation";
import { Decimal } from "decimal.js";
import { addTransactionJob } from "../queues/transactionQueue";
import {
  CreateAccountRequest,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
  AccountBalance,
  TransactionResult,
  BankingError,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from "../types";

export class AccountService {
  constructor(
    public accountRepo: AccountRepository,
    public transactionRepo: TransactionRepository,
  ) {}

  async createAccount(request: CreateAccountRequest): Promise<string> {
    validateHolderName(request.holderName);
    const initialBalance = validateAmount(request.initialDeposit);

    const account = await this.accountRepo.create({
      accountNumber: this.generateAccountNumber(),
      holderName: request.holderName.trim(),
      balance: Decimal(0),
    });

    const transaction = await this.transactionRepo.create({
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: initialBalance,
      toAccountId: account.id,
      description: "Initial deposit",
      status: TRANSACTION_STATUSES.PENDING,
    });

    await addTransactionJob("DEPOSIT", transaction.id, { immediate: true });
    return account.id;
  }

  async deposit(request: DepositRequest): Promise<TransactionResult> {
    validateAccountId(request.accountId);
    const amount = validateAmount(request.amount);
    const account = await this.validateActiveAccount(request.accountId);

    const transaction = await this.transactionRepo.create({
      type: TRANSACTION_TYPES.DEPOSIT,
      amount,
      toAccountId: account.id,
      description: "Deposit",
      status: TRANSACTION_STATUSES.PENDING,
    });

    await addTransactionJob("DEPOSIT", transaction.id, { priority: 1 });
    return {
      success: true,
      transactionId: transaction.id,
      message: "Deposit is being processed",
      balance: new Decimal(account.balance),
    };
  }

  async withdraw(request: WithdrawalRequest): Promise<TransactionResult> {
    validateAccountId(request.accountId);
    const amount = validateAmount(request.amount);
    const account = await this.validateActiveAccount(request.accountId);

    if (new Decimal(account.balance).lessThan(amount)) {
      throw new BankingError("Insufficient funds", "INSUFFICIENT_FUNDS");
    }

    const transaction = await this.transactionRepo.create({
      type: TRANSACTION_TYPES.WITHDRAWAL,
      amount,
      fromAccountId: account.id,
      description: "Withdrawal",
      status: TRANSACTION_STATUSES.PENDING,
    });

    await addTransactionJob("WITHDRAWAL", transaction.id);
    return {
      success: true,
      transactionId: transaction.id,
      message: "Withdrawal is being processed",
      balance: new Decimal(account.balance),
    };
  }

  async transfer(request: TransferRequest): Promise<TransactionResult> {
    validateAccountId(request.fromAccountId);
    validateAccountId(request.toAccountId);
    const amount = validateAmount(request.amount);

    if (request.fromAccountId === request.toAccountId) {
      throw new BankingError(
        "Cannot transfer to same account",
        "SAME_ACCOUNT_TRANSFER",
      );
    }

    const [fromAccount, toAccount] = await Promise.all([
      this.validateActiveAccount(request.fromAccountId),
      this.validateActiveAccount(request.toAccountId),
    ]);

    if (new Decimal(fromAccount.balance).lessThan(amount)) {
      throw new BankingError("Insufficient funds", "INSUFFICIENT_FUNDS");
    }

    const transaction = await this.transactionRepo.create({
      type: TRANSACTION_TYPES.TRANSFER,
      amount,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      description: `Transfer to ${toAccount.accountNumber}`,
      status: TRANSACTION_STATUSES.PENDING,
    });

    await addTransactionJob("TRANSFER", transaction.id, { priority: 2 });
    return {
      success: true,
      transactionId: transaction.id,
      message: "Transfer is being processed",
      balance: new Decimal(fromAccount.balance),
    };
  }

  async getBalance(accountId: string): Promise<AccountBalance> {
    validateAccountId(accountId);
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new BankingError("Account not found", "ACCOUNT_NOT_FOUND", 404);
    }
    return this.mapAccountToBalance(account);
  }

  async getAllAccounts(): Promise<AccountBalance[]> {
    const accounts = await this.accountRepo.findAll();
    return accounts.map((account) => this.mapAccountToBalance(account));
  }

  private async validateActiveAccount(accountId: string) {
    const account = await this.accountRepo.findById(accountId);
    if (!account)
      throw new BankingError("Account not found", "ACCOUNT_NOT_FOUND", 404);
    if (!account.isActive)
      throw new BankingError("Account is inactive", "ACCOUNT_INACTIVE");
    return account;
  }

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `ACC${timestamp.slice(-6)}${random}`;
  }

  private mapAccountToBalance(account: any): AccountBalance {
    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      balance: new Decimal(account.balance),
      holderName: account.holderName,
    };
  }
}
