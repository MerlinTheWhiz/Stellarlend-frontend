import { z } from "zod";
import { StellarAddress, I128String } from "@/lib/validation/validators";

export const lendingDataSchema = z.object({
  asset: z
    .string()
    .min(1, "Asset is required")
    .max(64, "Asset must be 64 characters or less"),
  amount: z.union([
    z
      .number()
      .positive("Amount must be positive")
      .finite("Amount must be a finite number"),
    I128String,
  ]),
  interestRate: z
    .number()
    .positive("Interest rate must be positive")
    .finite("Interest rate must be a finite number"),
  duration: z
    .number()
    .int("Duration must be an integer")
    .positive("Duration must be positive")
    .optional(),
  collateral: z
    .string()
    .min(1, "Collateral is required")
    .max(56, "Collateral must be 56 characters or less")
    .optional(),
  collateralAmount: z
    .union([
      z
        .number()
        .positive("Collateral amount must be positive")
        .finite("Collateral amount must be a finite number"),
      I128String,
    ])
    .optional(),
});

export type LendingDataInput = z.infer<typeof lendingDataSchema>;

export const lendingQuoteRequestSchema = z.object({
  type: z.enum(["lend", "borrow"]),
  data: lendingDataSchema,
});

export type LendingQuoteRequestInput = z.infer<typeof lendingQuoteRequestSchema>;

export const lendingTxBuildRequestSchema = z.object({
  type: z.enum(["lend", "borrow"]),
  sourceAccount: StellarAddress,
  data: lendingDataSchema,
});

export type LendingTxBuildRequestInput = z.infer<typeof lendingTxBuildRequestSchema>;
