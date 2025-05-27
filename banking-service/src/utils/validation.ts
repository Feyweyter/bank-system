import { Decimal } from "decimal.js";
import { BankingError } from "../types";

export function validateAmount(amount: number): Decimal {
  if (amount <= 0) {
    throw new BankingError("Amount must be positive", "INVALID_AMOUNT");
  }

  if (!Number.isFinite(amount)) {
    throw new BankingError("Amount must be a valid number", "INVALID_AMOUNT");
  }

  const decimal = new Decimal(amount);

  if (decimal.decimalPlaces() > 2) {
    throw new BankingError(
      "Amount cannot have more than 2 decimal places",
      "INVALID_AMOUNT",
    );
  }

  return decimal;
}

export function validateAccountId(accountId: string): void {
  if (!accountId || typeof accountId !== "string") {
    throw new BankingError(
      "Valid account ID is required",
      "INVALID_ACCOUNT_ID",
    );
  }
}

export function validateHolderName(holderName: string): void {
  if (
    !holderName ||
    typeof holderName !== "string" ||
    holderName.trim().length === 0
  ) {
    throw new BankingError(
      "Valid holder name is required",
      "INVALID_HOLDER_NAME",
    );
  }

  if (holderName.trim().length < 2) {
    throw new BankingError(
      "Holder name must be at least 2 characters",
      "INVALID_HOLDER_NAME",
    );
  }
}
