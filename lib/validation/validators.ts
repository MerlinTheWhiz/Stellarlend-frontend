import { z } from "zod";
import { StrKey } from "@stellar/stellar-sdk";

const I128_MIN = -(2n ** 127n);
const I128_MAX = 2n ** 127n - 1n;

const i128Pattern = /^-?\d+$/;

function isValidI128String(val: string): boolean {
  if (!i128Pattern.test(val)) return false;
  try {
    const big = BigInt(val);
    return big >= I128_MIN && big <= I128_MAX;
  } catch {
    return false;
  }
}

function isValidStellarAddress(val: string): boolean {
  if (val.startsWith("G")) {
    try {
      return StrKey.isValidEd25519PublicKey(val);
    } catch {
      return false;
    }
  }
  if (val.startsWith("M")) {
    return /^M[A-Z2-7]{55,}$/.test(val);
  }
  if (val.startsWith("C")) {
    return /^C[A-Z2-7]{55}$/.test(val);
  }
  return false;
}

export const StellarAddress = z.string().refine(isValidStellarAddress, {
  message:
    "Invalid Stellar address. Must be a valid G (public key), M (muxed), or C (contract) address.",
});

export const I128String = z.string().refine(isValidI128String, {
  message: "Amount must be a valid i128 integer string.",
});

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ValidationError {
  code: "VALIDATION_ERROR";
  details: ValidationDetail[];
}

export function formatZodErrors(error: z.ZodError): ValidationError {
  return {
    code: "VALIDATION_ERROR",
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
