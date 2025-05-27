import { prisma } from "../config/database";
import { Transaction, Account } from "@prisma/client";
import { Decimal } from "decimal.js";
import { TransactionType, TransactionStatus } from "../types";

export class TransactionRepository {
  async create(data: {
    type: TransactionType;
    amount: Decimal;
    fromAccountId?: string;
    toAccountId?: string;
    description?: string;
    status?: TransactionStatus;
  }): Promise<Transaction> {
    return await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        description: data.description,
        status: data.status || "PENDING",
      },
    });
  }

  async getTransactionWithAccounts(transactionId: string): Promise<
    | (Transaction & {
        fromAccount: Account | null;
        toAccount: Account | null;
      })
    | null
  > {
    return prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });
  }

  async completeTransaction(id: string): Promise<Transaction> {
    return await this.updateStatus(id, "COMPLETED");
  }

  async failTransaction(id: string): Promise<Transaction> {
    return await this.updateStatus(id, "FAILED");
  }

  private async updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    return await prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
