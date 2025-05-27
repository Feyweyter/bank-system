import { Decimal } from "decimal.js";

export interface CreateAccountRequest {
  holderName: string;
  initialDeposit: number;
}

export interface DepositRequest {
  accountId: string;
  amount: number;
}

export interface WithdrawalRequest {
  accountId: string;
  amount: number;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  balance: Decimal;
  holderName: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  message: string;
  balance?: Decimal;
}

export class BankingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "BankingError";
  }
}

// Transaction types and statuses as constants
export const TRANSACTION_TYPES = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRANSFER: "TRANSFER",
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];
export type TransactionStatus =
  (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];
