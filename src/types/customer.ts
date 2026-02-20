export interface StoreCustomerUser {
  id?: number;
  uid?: string;
  name: string;
  email: string;
  provider?: "api" | "firebase";
}

export interface StoreCustomerAuthResponse {
  ok: boolean;
  message?: string;
  token?: string;
  expiresAt?: string;
  user?: StoreCustomerUser;
}

export interface StoreCustomerSessionResponse {
  ok: boolean;
  message?: string;
  user?: StoreCustomerUser;
}

export interface StoreCustomerLogoutResponse {
  ok: boolean;
  message?: string;
}
