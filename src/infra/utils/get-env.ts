/**
 * Environment configuration — reads from .env.local.
 * All vars must be defined there; getEnv throws if missing.
 */

export function getEnv(key: string): string {
  const value = process.env[key];
  if (value == null || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
