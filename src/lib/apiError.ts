import { NextResponse } from "next/server";

/** Never leak stack traces or internal details to the client — log server-side instead. */
export function handleApiError(err: unknown, fallbackMessage = "Something went wrong.") {
  console.error(err);
  if (err instanceof Error && (err as { statusCode?: number }).statusCode) {
    return NextResponse.json({ error: err.message }, { status: (err as unknown as { statusCode: number }).statusCode });
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
