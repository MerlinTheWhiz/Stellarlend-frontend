import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  StellarAddress,
  I128String,
  formatZodErrors,
} from "@/lib/validation/validators";
import {
  lendingDataSchema,
  lendingQuoteRequestSchema,
  lendingTxBuildRequestSchema,
} from "@/lib/validation/schemas/lending";

const validG =
  "GAKCNH54SWY4R2SAMIC2M3OLRRMIA4LYAWJJIRCJCYCBBOIO5Z3PMPJY";
const invalidG =
  "GAKCNH54SWY4R2SAMIC2M3OLRRMIA4LYAWJJIRCJCYCBBOIO5Z3PMPJX";
const validM =
  "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const invalidM = "MZINVALIDADDRESS1234567890";
const validC =
  "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const invalidC = "CZINVALIDADDRESS1234567890";

const validPayload = {
  type: "lend" as const,
  sourceAccount: validG,
  data: {
    asset: "XLM",
    amount: 1000,
    interestRate: 10,
    duration: 30,
  },
};

describe("StellarAddress", () => {
  it("accepts a valid G (Ed25519) address", () => {
    expect(StellarAddress.safeParse(validG).success).toBe(true);
  });

  it("rejects an invalid G address (bad checksum)", () => {
    const result = StellarAddress.safeParse(invalidG);
    expect(result.success).toBe(false);
  });

  it("accepts a valid M (muxed) address", () => {
    expect(StellarAddress.safeParse(validM).success).toBe(true);
  });

  it("rejects an invalid M address", () => {
    const result = StellarAddress.safeParse(invalidM);
    expect(result.success).toBe(false);
  });

  it("accepts a valid C (contract) address", () => {
    expect(StellarAddress.safeParse(validC).success).toBe(true);
  });

  it("rejects an invalid C address", () => {
    const result = StellarAddress.safeParse(invalidC);
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = StellarAddress.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a string that is too short", () => {
    const result = StellarAddress.safeParse("G123");
    expect(result.success).toBe(false);
  });

  it("rejects a non-Stellar prefix (X)", () => {
    const result = StellarAddress.safeParse(
      "XAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQ"
    );
    expect(result.success).toBe(false);
  });

  it("rejects undefined", () => {
    const result = StellarAddress.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = StellarAddress.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe("I128String", () => {
  it('accepts "0"', () => {
    expect(I128String.safeParse("0").success).toBe(true);
  });

  it('accepts "1"', () => {
    expect(I128String.safeParse("1").success).toBe(true);
  });

  it('accepts "-1"', () => {
    expect(I128String.safeParse("-1").success).toBe(true);
  });

  it("accepts the maximum i128 value", () => {
    expect(
      I128String.safeParse("170141183460469231731687303715884105727").success
    ).toBe(true);
  });

  it("accepts the minimum i128 value", () => {
    expect(
      I128String.safeParse("-170141183460469231731687303715884105728").success
    ).toBe(true);
  });

  it("rejects a value exceeding i128 max", () => {
    const result = I128String.safeParse(
      "170141183460469231731687303715884105728"
    );
    expect(result.success).toBe(false);
  });

  it("rejects a value below i128 min", () => {
    const result = I128String.safeParse(
      "-170141183460469231731687303715884105729"
    );
    expect(result.success).toBe(false);
  });

  it("rejects a decimal string", () => {
    const result = I128String.safeParse("123.45");
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric string", () => {
    const result = I128String.safeParse("abc");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = I128String.safeParse("");
    expect(result.success).toBe(false);
  });

  it("accepts a string with leading zeros", () => {
    expect(I128String.safeParse("00123").success).toBe(true);
  });

  it("rejects a standalone minus sign", () => {
    const result = I128String.safeParse("-");
    expect(result.success).toBe(false);
  });

  it("rejects a plus-prefixed string", () => {
    const result = I128String.safeParse("+123");
    expect(result.success).toBe(false);
  });

  it("rejects undefined", () => {
    const result = I128String.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it("rejects a number input (not a string)", () => {
    const result = I128String.safeParse(42);
    expect(result.success).toBe(false);
  });
});

describe("formatZodErrors", () => {
  it("formats a single issue", () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted.code).toBe("VALIDATION_ERROR");
      expect(formatted.details).toHaveLength(1);
      expect(formatted.details[0].field).toBe("name");
      expect(formatted.details[0].message).toContain("1 character");
    }
  });

  it("formats multiple issues", () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    });
    const result = schema.safeParse({ name: "", age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted.code).toBe("VALIDATION_ERROR");
      expect(formatted.details.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("includes nested paths", () => {
    const result = lendingQuoteRequestSchema.safeParse({
      type: "lend",
      data: { asset: "", amount: -1, interestRate: "bad" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      const paths = formatted.details.map((d) => d.field);
      expect(paths).toContain("data.asset");
      expect(paths).toContain("data.amount");
    }
  });
});

describe("lendingDataSchema", () => {
  it("accepts valid data with number amount", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: 10,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid data with string amount (i128)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: "1000",
      interestRate: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe("1000");
    }
  });

  it("accepts optional fields (duration, collateral, collateralAmount)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "USDC",
      amount: 5000,
      interestRate: 8.5,
      duration: 90,
      collateral: "XLM",
      collateralAmount: 10000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe(90);
      expect(result.data.collateral).toBe("XLM");
      expect(result.data.collateralAmount).toBe(10000);
    }
  });

  it("rejects empty asset", () => {
    const result = lendingDataSchema.safeParse({
      asset: "",
      amount: 1000,
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount (number)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 0,
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount (number)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: -100,
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects NaN amount (number)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: NaN,
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects Infinity amount (number)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: Infinity,
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects string amount that is not a valid i128", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: "not-a-number",
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero interest rate", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative interest rate", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float duration (not integer)", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: 10,
      duration: 30.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: 10,
      duration: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty collateral string", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: 10,
      collateral: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts collateralAmount as i128 string", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
      interestRate: 10,
      collateral: "XLM",
      collateralAmount: "5000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collateralAmount).toBe("5000");
    }
  });

  it("rejects missing asset", () => {
    const result = lendingDataSchema.safeParse({
      amount: 1000,
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing amount", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      interestRate: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing interestRate", () => {
    const result = lendingDataSchema.safeParse({
      asset: "XLM",
      amount: 1000,
    });
    expect(result.success).toBe(false);
  });
});

describe("lendingQuoteRequestSchema", () => {
  it("accepts a valid lend request", () => {
    const result = lendingQuoteRequestSchema.safeParse({
      type: "lend",
      data: { asset: "XLM", amount: 1000, interestRate: 10 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid borrow request", () => {
    const result = lendingQuoteRequestSchema.safeParse({
      type: "borrow",
      data: {
        asset: "USDC",
        amount: 5000,
        interestRate: 8.5,
        duration: 90,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    const result = lendingQuoteRequestSchema.safeParse({
      type: "swap",
      data: { asset: "XLM", amount: 1000, interestRate: 10 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing data", () => {
    const result = lendingQuoteRequestSchema.safeParse({
      type: "lend",
    });
    expect(result.success).toBe(false);
  });

  it("rejects null body", () => {
    const result = lendingQuoteRequestSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe("lendingTxBuildRequestSchema", () => {
  it("accepts a valid request with G address", () => {
    const result = lendingTxBuildRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts a valid request with M address", () => {
    const result = lendingTxBuildRequestSchema.safeParse({
      ...validPayload,
      sourceAccount: validM,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid request with C address", () => {
    const result = lendingTxBuildRequestSchema.safeParse({
      ...validPayload,
      sourceAccount: validC,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid sourceAccount", () => {
    const result = lendingTxBuildRequestSchema.safeParse({
      ...validPayload,
      sourceAccount: invalidG,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing sourceAccount", () => {
    const result = lendingTxBuildRequestSchema.safeParse({
      type: "lend",
      data: { asset: "XLM", amount: 1000, interestRate: 10 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects null sourceAccount", () => {
    const result = lendingTxBuildRequestSchema.safeParse({
      ...validPayload,
      sourceAccount: null,
    });
    expect(result.success).toBe(false);
  });
});
