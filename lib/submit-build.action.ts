"use server";
import axios from "axios";
import type { BuildSubmission } from "./submit-build";

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

/** Server Actions are reachable by direct POST, so check the payload here. */
const isValid = (s: BuildSubmission) =>
  isText(s?.build?.vehicle) &&
  Array.isArray(s.build.upfits) &&
  s.build.upfits.every((u) => typeof u === "string") &&
  REQUIRED_CUSTOMER_FIELDS.every((f) => isText(s.customer?.[f]));

/**
 * Sends a customer's build to the sales webhook. Runs on the server, so the
 * browser never calls the webhook (no CORS) and its URL stays private.
 * Throws on any failure so the form can show an error.
 */
export async function submitBuild(submission: BuildSubmission) {
  const root = process.env.NEXT_PUBLIC_WEBHOOK_ROOT_URL;
  if (!root) throw new Error("WEBHOOK_ROOT_URL is not configured");
  if (!isValid(submission)) throw new Error("Invalid quote request");

  try {
    await axios.post(`${root}/tb/quote`, submission, { timeout: 10_000 });
  } catch (error) {
    console.error(
      "Quote webhook failed:",
      axios.isAxiosError(error) ? (error.response?.status ?? error.code) : error,
    );
    throw new Error("Quote request failed");
  }
}
