import { AccountService } from "../accountService";
import { AccountRepository } from "../../repositories/accountRepository";
import { TransactionRepository } from "../../repositories/transactionRepository";
import { Decimal } from "decimal.js";
import {
  BankingError,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from "../../types";
import { resetMocks } from "../../test/setup";

// Mock the queue
jest.mock("../../queues/transactionQueue", () => ({
  addTransactionJob: jest.fn().mockResolvedValue(undefined),
}));

describe("AccountService", () => {
  let accountService: AccountService;
  let mockAccountRepo: jest.Mocked<AccountRepository>;
  let mockTransactionRepo: jest.Mocked<TransactionRepository>;

  const now = new Date();

  beforeEach(() => {
    // Reset all mocks
    resetMocks();

    // Create mock repositories
    mockAccountRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;

    mockTransactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    accountService = new AccountService(mockAccountRepo, mockTransactionRepo);
  });

  describe("createAccount", () => {
    it("should create a new account with initial deposit", async () => {
      const mockAccount = {
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(0),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const mockTransaction = {
        id: "tx-123",
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: new Decimal(100),
        status: TRANSACTION_STATUSES.PENDING,
        createdAt: now,
        updatedAt: now,
        fromAccountId: null,
        toAccountId: "acc-123",
        description: "Initial deposit",
      };

      mockAccountRepo.create.mockResolvedValue(mockAccount);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);

      const result = await accountService.createAccount({
        holderName: "John Doe",
        initialDeposit: 100,
      });

      expect(result).toBe("acc-123");
      expect(mockAccountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          holderName: "John Doe",
          balance: new Decimal(0),
        }),
      );
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TRANSACTION_TYPES.DEPOSIT,
          amount: new Decimal(100),
          status: TRANSACTION_STATUSES.PENDING,
        }),
      );
    });

    it("should throw error for invalid holder name", async () => {
      await expect(
        accountService.createAccount({
          holderName: "",
          initialDeposit: 100,
        }),
      ).rejects.toThrow(BankingError);
    });
  });

  describe("deposit", () => {
    it("should process a valid deposit request", async () => {
      const mockAccount = {
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(100),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const mockTransaction = {
        id: "tx-123",
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: new Decimal(50),
        status: TRANSACTION_STATUSES.PENDING,
        createdAt: now,
        updatedAt: now,
        fromAccountId: null,
        toAccountId: "acc-123",
        description: "Deposit",
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);

      const result = await accountService.deposit({
        accountId: "acc-123",
        amount: 50,
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx-123");
      expect(result.balance).toEqual(new Decimal(100));
    });

    it("should throw error for inactive account", async () => {
      mockAccountRepo.findById.mockResolvedValue({
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(0),
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });

      await expect(
        accountService.deposit({
          accountId: "acc-123",
          amount: 50,
        }),
      ).rejects.toThrow(BankingError);
    });
  });

  describe("withdraw", () => {
    it("should process a valid withdrawal request", async () => {
      const mockAccount = {
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(100),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const mockTransaction = {
        id: "tx-123",
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: new Decimal(50),
        status: TRANSACTION_STATUSES.PENDING,
        createdAt: now,
        updatedAt: now,
        fromAccountId: "acc-123",
        toAccountId: null,
        description: "Withdrawal",
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);

      const result = await accountService.withdraw({
        accountId: "acc-123",
        amount: 50,
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx-123");
      expect(result.balance).toEqual(new Decimal(100));
    });

    it("should throw error for insufficient funds", async () => {
      mockAccountRepo.findById.mockResolvedValue({
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(20),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      await expect(
        accountService.withdraw({
          accountId: "acc-123",
          amount: 50,
        }),
      ).rejects.toThrow(BankingError);
    });
  });

  describe("transfer", () => {
    it("should process a valid transfer request", async () => {
      const mockFromAccount = {
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(100),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const mockToAccount = {
        id: "acc-456",
        accountNumber: "ACC789012",
        holderName: "Jane Doe",
        balance: new Decimal(50),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const mockTransaction = {
        id: "tx-123",
        type: TRANSACTION_TYPES.TRANSFER,
        amount: new Decimal(30),
        status: TRANSACTION_STATUSES.PENDING,
        createdAt: now,
        updatedAt: now,
        fromAccountId: "acc-123",
        toAccountId: "acc-456",
        description: "Transfer to ACC789012",
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(mockFromAccount)
        .mockResolvedValueOnce(mockToAccount);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);

      const result = await accountService.transfer({
        fromAccountId: "acc-123",
        toAccountId: "acc-456",
        amount: 30,
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx-123");
      expect(result.balance).toEqual(new Decimal(100));
    });

    it("should throw error for same account transfer", async () => {
      await expect(
        accountService.transfer({
          fromAccountId: "acc-123",
          toAccountId: "acc-123",
          amount: 30,
        }),
      ).rejects.toThrow(BankingError);
    });
  });

  describe("getBalance", () => {
    it("should return account balance", async () => {
      const mockAccount = {
        id: "acc-123",
        accountNumber: "ACC123456",
        holderName: "John Doe",
        balance: new Decimal(100),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await accountService.getBalance("acc-123");

      expect(result).toEqual({
        accountId: "acc-123",
        accountNumber: "ACC123456",
        balance: new Decimal(100),
        holderName: "John Doe",
      });
    });

    it("should throw error for non-existent account", async () => {
      mockAccountRepo.findById.mockResolvedValue(null);

      await expect(accountService.getBalance("acc-123")).rejects.toThrow(
        BankingError,
      );
    });
  });
});
