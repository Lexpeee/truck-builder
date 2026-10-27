export type CustomerDetails = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  industry: string;
  purchaseMethod: string;
  purchaseTime: string;
  deliveryAddress: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  callbackTime: string;
};

export type CompleteAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type BuildSubmission = {
  build: { vehicle: string; upfits: string[] };
  customer: CustomerDetails;
};

/** Sends a customer's build to our quote endpoint, which forwards it to the sales webhook. */
export async function submitBuild(submission: BuildSubmission) {
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  if (!res.ok) throw new Error("Quote request failed");
}
