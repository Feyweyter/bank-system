import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock Redis
jest.mock("ioredis", () => {
  const mockRedis = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    Redis: jest.fn(() => mockRedis),
  };
});

// Export test utilities
export const createTestPrismaClient = () => {
  return new PrismaClient();
};

export const createTestRedisClient = () => {
  return new Redis();
};

// Helper function to reset all mocks between tests
export const resetMocks = () => {
  jest.clearAllMocks();
};
