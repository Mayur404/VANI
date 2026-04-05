import type { Request } from "express";
import { Prisma } from "../../../generated/prisma/client";

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const parseDomainFilter = (value: unknown): Prisma.SessionWhereInput["domain"] => {
  if (value === undefined || value === "all") {
    return undefined;
  }

  if (value === "healthcare" || value === "finance") {
    return value;
  }

  throw new HttpError(400, "Invalid domain. Use healthcare, finance, or all.");
};

export const parsePositiveInt = (
  value: unknown,
  fallback: number,
  fieldName: string,
  options?: { min?: number; max?: number },
): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new HttpError(400, `Invalid ${fieldName}. Expected an integer.`);
  }

  if (options?.min !== undefined && parsed < options.min) {
    throw new HttpError(400, `Invalid ${fieldName}. Minimum is ${options.min}.`);
  }

  if (options?.max !== undefined && parsed > options.max) {
    throw new HttpError(400, `Invalid ${fieldName}. Maximum is ${options.max}.`);
  }

  return parsed;
};

export const parseDateRangeFilters = (req: Request) => {
  const domain = parseDomainFilter(req.query.domain);
  const days = parsePositiveInt(req.query.days, 30, "days", { min: 1, max: 365 });
  const since = new Date();

  since.setDate(since.getDate() - days);

  return {
    domain,
    days,
    where: {
      createdAt: { gte: since },
      ...(domain ? { domain } : {}),
    } satisfies Prisma.SessionWhereInput,
  };
};

export const toNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
};
