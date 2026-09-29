export type Citation = {
  n: number;
  document: string;
  heading: string | null;
  position: number;
  excerpt: string;
};

export type AskOutcome =
  | { status: "answered"; answer: string; citations: Citation[] }
  | { status: "refused"; answer: string; citations: [] }
  | {
      status: "invalid";
      reason: "question_missing" | "question_too_long" | "session_too_long";
      message: string;
    }
  | { status: "rate_limited"; retryAfterSeconds: number; message: string }
  | { status: "unavailable"; reason: "daily_limit" | "configuration"; message: string };
