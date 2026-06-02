import { NextResponse } from "next/server";
import { calculateQuote } from "@/lib/lending/quote";
import { lendingQuoteRequestSchema } from "@/lib/validation/schemas/lending";
import { formatZodErrors } from "@/lib/validation/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid request body." } },
      { status: 400 }
    );
  }

  const parsed = lendingQuoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const outcome = calculateQuote(parsed.data.type, parsed.data.data);

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 400 });
  }

  return NextResponse.json({ result: outcome.result }, { status: 200 });
}

