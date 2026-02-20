import type { StoreCustomerUser } from "../types/customer";

const STORE_TOKEN_KEY = "storeUserToken";
const STORE_USER_KEY = "storeUserData";
const STORE_AUTH_CHANGED_EVENT = "storeAuthChanged";

function emitStoreAuthChanged(): void {
  globalThis.dispatchEvent(new Event(STORE_AUTH_CHANGED_EVENT));
}

export function getStoreAuthChangedEventName(): string {
  return STORE_AUTH_CHANGED_EVENT;
}

export function getStoreUserToken(): string | null {
  return globalThis.localStorage.getItem(STORE_TOKEN_KEY);
}

export function getStoreUser(): StoreCustomerUser | null {
  const raw = globalThis.localStorage.getItem(STORE_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoreCustomerUser>;
    const email = parsed?.email?.trim() ?? "";
    const uid = parsed?.uid?.trim() ?? "";
    const numericId = parsed?.id ? Number(parsed.id) || 0 : 0;

    if (!email) return null;
    if (!uid && !numericId) return null;

    return {
      id: numericId || undefined,
      uid: uid || undefined,
      name: parsed.name ?? "",
      email,
      provider: parsed.provider === "firebase" ? "firebase" : "api",
    };
  } catch {
    return null;
  }
}

export function getStoreUserId(): number | null {
  const user = getStoreUser();
  return user?.id ? Number(user.id) || null : null;
}

export function getStoreUserProvider(): "api" | "firebase" | null {
  const user = getStoreUser();
  if (!user?.provider) return null;
  return user.provider;
}

export function getStoreCartOwnerKey(): string | null {
  const user = getStoreUser();
  if (!user) return null;

  if (user.provider === "firebase" && user.uid) {
    return `firebase:${user.uid}`;
  }

  if (user.id) {
    return `api:${user.id}`;
  }

  if (user.email) {
    return `email:${user.email.toLowerCase()}`;
  }

  return null;
}

export function isStoreUserLoggedIn(): boolean {
  return !!getStoreUserToken() && !!getStoreUser();
}

export function setStoreSession(token: string, user: StoreCustomerUser): void {
  const normalizedProvider = user.provider ?? "api";
  const normalizedUser: StoreCustomerUser = {
    ...user,
    provider: normalizedProvider,
  };

  globalThis.localStorage.setItem(STORE_TOKEN_KEY, token);
  globalThis.localStorage.setItem(STORE_USER_KEY, JSON.stringify(normalizedUser));
  emitStoreAuthChanged();
}

export function clearStoreSession(): void {
  globalThis.localStorage.removeItem(STORE_TOKEN_KEY);
  globalThis.localStorage.removeItem(STORE_USER_KEY);
  emitStoreAuthChanged();
}
