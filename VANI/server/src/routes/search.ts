import { Router } from "express";

import { prisma } from "../lib/prisma";
import { parsePositiveInt } from "../lib/http";

export const searchRouter = Router();

searchRouter.get("/patients", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const take = parsePositiveInt(req.query.limit, 20, "limit", { min: 1, max: 50 });

    const patients = await prisma.patient.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { phoneNumber: { contains: q } },
              { insuranceId: { contains: q } },
              {
                healthcareReports: {
                  some: {
                    diagnosis: { contains: q },
                  },
                },
              },
            ],
          }
        : undefined,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        healthcareReports: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            diagnosis: true,
            severity: true,
            followUpDate: true,
          },
        },
      },
    });

    res.json({
      filters: {
        q,
        limit: take,
      },
      patients,
    });
  } catch (error) {
    next(error);
  }
});

searchRouter.get("/customers", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const take = parsePositiveInt(req.query.limit, 20, "limit", { min: 1, max: 50 });

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { phoneNumber: { contains: q } },
              { loanAccountNumber: { contains: q } },
              {
                financeReports: {
                  some: {
                    OR: [
                      { payerName: { contains: q } },
                      { executiveNotes: { contains: q } },
                    ],
                  },
                },
              },
            ],
          }
        : undefined,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        financeReports: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            paymentStatus: true,
            amountPaid: true,
            promiseToPayDate: true,
            escalationRequired: true,
          },
        },
      },
    });

    res.json({
      filters: {
        q,
        limit: take,
      },
      customers,
    });
  } catch (error) {
    next(error);
  }
});
