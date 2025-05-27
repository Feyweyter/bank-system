import { Request, Response } from "express";
import { AccountService } from "../services/accountService";
import { BankingError } from "../types";
import { logger } from "../config/logger";

export class AccountController {
  constructor(private accountService: AccountService) {}

  async createAccount(req: Request, res: Response) {
    try {
      const { holderName, initialDeposit } = req.body;
      const accountId = await this.accountService.createAccount({
        holderName,
        initialDeposit,
      });
      res.status(201).json({
        success: true,
        data: { accountId },
        message: "Account created successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deposit(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;
      const result = await this.accountService.deposit({ accountId, amount });
      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async withdraw(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;
      const result = await this.accountService.withdraw({ accountId, amount });
      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async transfer(req: Request, res: Response) {
    try {
      const { fromAccountId, toAccountId, amount } = req.body;
      const result = await this.accountService.transfer({
        fromAccountId,
        toAccountId,
        amount,
      });
      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const balance = await this.accountService.getBalance(accountId);
      res.json({
        success: true,
        data: balance,
        message: "Balance retrieved successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAllAccounts(req: Request, res: Response) {
    try {
      const accounts = await this.accountService.getAllAccounts();
      res.json({
        success: true,
        data: accounts,
        message: "Accounts retrieved successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response) {
    logger.error("Controller error", { error });
    if (error instanceof BankingError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal error occurred",
        },
      });
    }
  }
}
