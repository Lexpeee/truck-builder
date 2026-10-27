import axios from "axios";
import type { BuildSubmission } from "@/lib/submit-build";

const REQUIRED_CUSTOMER_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "companyName",
  "industry",
  "purchaseMethod",
  "purchaseTime",
  "deliveryAddress",
  "callbackTime",
] as const;

const isText = (v: unknown) => typeof v === "string" && v.trim() !== "";

const isValid = (s: BuildSubmission) =>
  isText(s?.build?.vehicle) &&
  Array.isArray(s.build.upfits) &&
  s.build.upfits.every((u) => typeof u === "string") &&
  REQUIRED_CUSTOMER_FIELDS.every((f) => isText(s.customer?.[f]));

/**
 * Forwards a customer's build to the sales webhook. Runs on the server, so the
 * browser never calls the webhook (no CORS) and its URL stays private.
 */
export async function POST(request: Request) {
  const root = process.env.WEBHOOK_ROOT_URL;
  if (!root) {
    console.error("WEBHOOK_ROOT_URL is not configured");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  const submission: BuildSubmission | null = await request.json().catch(() => null);
  if (!submission || !isValid(submission)) {
    return Response.json({ error: "Invalid quote request" }, { status: 400 });
  }

  try {
    const { data } = await axios.post(`${root}/tb/quote`, submission, { timeout: 10_000 });
    return Response.json({ success: true, data });
  } catch (error) {
    console.error(
      "Quote webhook failed:",
      axios.isAxiosError(error) ? (error.response?.status ?? error.code) : error,
    );
    return Response.json({ error: "Quote request failed" }, { status: 502 });
  }
}
