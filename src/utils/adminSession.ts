const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_MODE_KEY = "adminMode";
const ADMIN_FLAG_KEY = "isAdmin";
const ADMIN_USER_KEY = "adminUser";

function readSessionValue(key: string): string | null {
  const sessionValue = globalThis.window?.sessionStorage?.getItem(key) ?? null;
  if (sessionValue) return sessionValue;

  const legacyLocalValue = globalThis.window?.localStorage?.getItem(key) ?? null;
  if (!legacyLocalValue) return null;

  // Migra sesión legacy (localStorage) a sesión por pestaña (sessionStorage).
  globalThis.window?.sessionStorage?.setItem(key, legacyLocalValue);
  globalThis.window?.localStorage?.removeItem(key);
  return legacyLocalValue;
}

export function getAdminToken(): string | null {
  return readSessionValue(ADMIN_TOKEN_KEY);
}

export function getAdminMode(): string | null {
  return readSessionValue(ADMIN_MODE_KEY);
}

export function setAdminSession(token: string, userIdentifier: string): void {
  globalThis.window?.sessionStorage?.setItem(ADMIN_TOKEN_KEY, token);
  globalThis.window?.sessionStorage?.setItem(ADMIN_MODE_KEY, "api");
  globalThis.window?.sessionStorage?.setItem(ADMIN_FLAG_KEY, "true");
  globalThis.window?.sessionStorage?.setItem(ADMIN_USER_KEY, userIdentifier);

  globalThis.window?.localStorage?.removeItem(ADMIN_TOKEN_KEY);
  globalThis.window?.localStorage?.removeItem(ADMIN_MODE_KEY);
  globalThis.window?.localStorage?.removeItem(ADMIN_FLAG_KEY);
  globalThis.window?.localStorage?.removeItem(ADMIN_USER_KEY);
}

export function clearAdminSession(): void {
  globalThis.window?.sessionStorage?.removeItem(ADMIN_TOKEN_KEY);
  globalThis.window?.sessionStorage?.removeItem(ADMIN_MODE_KEY);
  globalThis.window?.sessionStorage?.removeItem(ADMIN_FLAG_KEY);
  globalThis.window?.sessionStorage?.removeItem(ADMIN_USER_KEY);

  globalThis.window?.localStorage?.removeItem(ADMIN_TOKEN_KEY);
  globalThis.window?.localStorage?.removeItem(ADMIN_MODE_KEY);
  globalThis.window?.localStorage?.removeItem(ADMIN_FLAG_KEY);
  globalThis.window?.localStorage?.removeItem(ADMIN_USER_KEY);
}
