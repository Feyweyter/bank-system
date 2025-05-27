import { prisma } from "../config/database";
import { Account } from "@prisma/client";
import { Decimal } from "decimal.js";

export class AccountRepository {
  async create(data: {
    accountNumber: string;
    holderName: string;
    balance: Decimal;
  }): Promise<Account> {
    return await prisma.account.create({
      data: {
        accountNumber: data.accountNumber,
        holderName: data.holderName,
        balance: data.balance,
      },
    });
  }

  async findById(id: string): Promise<Account | null> {
    return await prisma.account.findUnique({
      where: { id },
    });
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    return await prisma.account.findUnique({
      where: { accountNumber },
    });
  }

  async updateBalance(id: string, newBalance: Decimal): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: { balance: newBalance },
    });
  }

  async updateBalances(
    updates: { id: string; balance: Decimal }[],
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.account.update({
          where: { id: update.id },
          data: { balance: update.balance },
        });
      }
    });
  }

  async findAll(): Promise<Account[]> {
    return await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async deactivate(id: string): Promise<Account> {
    return await prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
