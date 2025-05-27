import IORedis from "ioredis";

export const redisClient = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

export async function connectRedis() {
  try {
    if (
      redisClient.status !== "connect" &&
      redisClient.status !== "connecting"
    ) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
}

export async function disconnectRedis() {
  await redisClient.quit();
}
