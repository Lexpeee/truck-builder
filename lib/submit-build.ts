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
