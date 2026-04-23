import pino, { type Logger } from "pino";

/**
 * Structured logger used server-side (API routes, server-only libs).
 *
 * - In development: uses `pino-pretty` for a readable, colorized stream.
 * - In production: writes JSON on stdout so log aggregators (Vercel, Datadog,
 *   etc.) can parse fields without regex.
 *
 * Levels: trace | debug | info | warn | error | fatal.
 * Default level is `info`; override with `LOG_LEVEL=debug` at boot.
 *
 * Always prefer structured fields over string interpolation:
 *
 *   logger.info({ projectId, msgCount }, "saving project");   // ✅
 *   logger.info(`saving project ${projectId}`);               // ❌ no fields
 */
const isDev = process.env.NODE_ENV !== "production";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});
