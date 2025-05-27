import { Request, Response } from "express";
import { AccountController } from "../accountController";
import { AccountService } from "../../services/accountService";
import { BankingError } from "../../types";
import { Decimal } from "decimal.js";

describe("AccountController", () => {
  let accountController: AccountController;
  let mockAccountService: jest.Mocked<AccountService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Create mock AccountService
    mockAccountService = {
      createAccount: jest.fn(),
      deposit: jest.fn(),
      withdraw: jest.fn(),
      transfer: jest.fn(),
      getBalance: jest.fn(),
      getAllAccounts: jest.fn(),
    } as any;

    // Create mock response methods
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();

    // Create mock request and response objects
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    accountController = new AccountController(mockAccountService);
  });

  describe("createAccount", () => {
    it("should create a new account successfully", async () => {
      const accountId = "acc-123";
      mockRequest.body = {
        holderName: "John Doe",
        initialDeposit: 1000,
      };
      mockAccountService.createAccount.mockResolvedValue(accountId);

      await accountController.createAccount(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAccountService.createAccount).toHaveBeenCalledWith({
        holderName: "John Doe",
        initialDeposit: 1000,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { accountId },
        message: "Account created successfully",
      });
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        holderName: "",
        initialDeposit: 1000,
      };
      const error = new BankingError("Invalid holder name", "VALIDATION_ERROR");
      mockAccountService.createAccount.mockRejectedValue(error);

      await accountController.createAccount(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid holder name",
        },
      });
    });
  });

  describe("deposit", () => {
    it("should process deposit successfully", async () => {
      const accountId = "acc-123";
      mockRequest.params = { accountId };
      mockRequest.body = { amount: 500 };
      const depositResult = {
        success: true,
        transactionId: "tx-123",
        message: "Deposit is being processed",
        balance: new Decimal(1500),
      };
      mockAccountService.deposit.mockResolvedValue(depositResult);

      await accountController.deposit(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAccountService.deposit).toHaveBeenCalledWith({
        accountId,
        amount: 500,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: depositResult,
        message: depositResult.message,
      });
    });

    it("should handle inactive account error", async () => {
      mockRequest.params = { accountId: "acc-123" };
      mockRequest.body = { amount: 500 };
      const error = new BankingError("Account is inactive", "ACCOUNT_INACTIVE");
      mockAccountService.deposit.mockRejectedValue(error);

      await accountController.deposit(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Account is inactive",
        },
      });
    });
  });

  describe("withdraw", () => {
    it("should process withdrawal successfully", async () => {
      const accountId = "acc-123";
      mockRequest.params = { accountId };
      mockRequest.body = { amount: 300 };
      const withdrawResult = {
        success: true,
        transactionId: "tx-123",
        message: "Withdrawal is being processed",
        balance: new Decimal(700),
      };
      mockAccountService.withdraw.mockResolvedValue(withdrawResult);

      await accountController.withdraw(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAccountService.withdraw).toHaveBeenCalledWith({
        accountId,
        amount: 300,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: withdrawResult,
        message: withdrawResult.message,
      });
    });

    it("should handle insufficient funds error", async () => {
      mockRequest.params = { accountId: "acc-123" };
      mockRequest.body = { amount: 1000 };
      const error = new BankingError(
        "Insufficient funds",
        "INSUFFICIENT_FUNDS",
      );
      mockAccountService.withdraw.mockRejectedValue(error);

      await accountController.withdraw(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Insufficient funds",
        },
      });
    });
  });

  describe("transfer", () => {
    it("should process transfer successfully", async () => {
      mockRequest.body = {
        fromAccountId: "acc-123",
        toAccountId: "acc-456",
        amount: 200,
      };
      const transferResult = {
        success: true,
        transactionId: "tx-123",
        message: "Transfer is being processed",
        balance: new Decimal(800),
      };
      mockAccountService.transfer.mockResolvedValue(transferResult);

      await accountController.transfer(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAccountService.transfer).toHaveBeenCalledWith({
        fromAccountId: "acc-123",
        toAccountId: "acc-456",
        amount: 200,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: transferResult,
        message: transferResult.message,
      });
    });

    it("should handle same account transfer error", async () => {
      mockRequest.body = {
        fromAccountId: "acc-123",
        toAccountId: "acc-123",
        amount: 200,
      };
      const error = new BankingError(
        "Cannot transfer to same account",
        "SAME_ACCOUNT_TRANSFER",
      );
      mockAccountService.transfer.mockRejectedValue(error);

      await accountController.transfer(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "SAME_ACCOUNT_TRANSFER",
          message: "Cannot transfer to same account",
        },
      });
    });
  });

  describe("getBalance", () => {
    it("should return account balance successfully", async () => {
      const accountId = "acc-123";
      mockRequest.params = { accountId };
      const balance = {
        accountId,
        accountNumber: "ACC123456",
        balance: new Decimal(1000),
        holderName: "John Doe",
      };
      mockAccountService.getBalance.mockResolvedValue(balance);

      await accountController.getBalance(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAccountService.getBalance).toHaveBeenCalledWith(accountId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: balance,
        message: "Balance retrieved successfully",
      });
    });

    it("should handle non-existent account error", async () => {
      mockRequest.params = { accountId: "acc-123" };
      const error = new BankingError(
        "Account not found",
        "ACCOUNT_NOT_FOUND",
        404,
      );
      mockAccountService.getBalance.mockRejectedValue(error);

      await accountController.getBalance(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "ACCOUNT_NOT_FOUND",
          message: "Account not found",
        },
      });
    });
  });

  describe("getAllAccounts", () => {
    it("should return all accounts successfully", async () => {
      const accounts = [
        {
          accountId: "acc-123",
          accountNumber: "ACC123456",
          balance: new Decimal(1000),
          holderName: "John Doe",
        },
        {
          accountId: "acc-456",
          accountNumber: "ACC789012",
          balance: new Decimal(500),
          holderName: "Jane Doe",
        },
      ];
      mockAccountService.getAllAccounts.mockResolvedValue(accounts);

      await accountController.getAllAccounts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAccountService.getAllAccounts).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: accounts,
        message: "Accounts retrieved successfully",
      });
    });

    it("should handle internal errors", async () => {
      mockAccountService.getAllAccounts.mockRejectedValue(
        new Error("Database error"),
      );

      await accountController.getAllAccounts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal error occurred",
        },
      });
    });
  });
});
