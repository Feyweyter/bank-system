import { createClient } from "redis";
import { logger } from "../config/logger";

class RedisService {
  private static instance: RedisService;
  public client: ReturnType<typeof createClient>;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => logger.error("Redis error:", err));
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async getConnection() {
    if (!this.client.isOpen) {
      await this.client.connect();
      logger.info("Redis connected successfully");
    }
    return this.client;
  }
}

export const redisService = RedisService.getInstance();
