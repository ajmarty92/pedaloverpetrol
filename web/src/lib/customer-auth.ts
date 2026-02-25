const CUST_ACCESS_KEY = "pop_cust_access_token";
const CUST_REFRESH_KEY = "pop_cust_refresh_token";
const CUST_NAME_KEY = "pop_cust_name";
const CUST_EMAIL_KEY = "pop_cust_email";

export function storeCustomerTokens(access: string, refresh: string) {
  localStorage.setItem(CUST_ACCESS_KEY, access);
  localStorage.setItem(CUST_REFRESH_KEY, refresh);
}

export function storeCustomerInfo(name: string, email: string) {
  localStorage.setItem(CUST_NAME_KEY, name);
  localStorage.setItem(CUST_EMAIL_KEY, email);
}

export function getCustomerAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUST_ACCESS_KEY);
}

export function getCustomerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUST_NAME_KEY);
}

export function getCustomerEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUST_EMAIL_KEY);
}

export function isCustomerAuthenticated(): boolean {
  return getCustomerAccessToken() !== null;
}

export function clearCustomerAuth() {
  localStorage.removeItem(CUST_ACCESS_KEY);
  localStorage.removeItem(CUST_REFRESH_KEY);
  localStorage.removeItem(CUST_NAME_KEY);
  localStorage.removeItem(CUST_EMAIL_KEY);
}
