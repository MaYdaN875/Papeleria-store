import { buildCandidateApiBases, getApiBase } from "./api/base";
import type {
  StoreCustomerAuthResponse,
  StoreCustomerLogoutResponse,
  StoreCustomerSessionResponse,
} from "../types/customer";

const API_BASE = getApiBase();

interface RawStoreCustomerUser {
  id: number | string;
  name: string;
  email: string;
}

function normalizeUser(raw: RawStoreCustomerUser) {
  return {
    id: Number(raw.id) || 0,
    name: raw.name ?? "",
    email: raw.email ?? "",
  };
}

async function requestWithBaseFallback<T>(
  path: string,
  requestInit: RequestInit
): Promise<{ response: Response; body: T }> {
  const candidateBases = buildCandidateApiBases(API_BASE);
  if (candidateBases.length === 0 || !candidateBases[0]) {
    throw new Error("VITE_API_URL no está configurada.");
  }

  let lastError: unknown = null;
  for (const base of candidateBases) {
    try {
      const response = await fetch(`${base}${path}`, requestInit);
      const body = (await response.json().catch(() => ({}))) as T;
      return { response, body };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No se pudo conectar con la API.");
}

export async function registerStoreCustomer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<StoreCustomerAuthResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      token?: string;
      expiresAt?: string;
      user?: RawStoreCustomerUser;
    }>("/public/auth/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo completar el registro.",
      };
    }

    return {
      ok: true,
      token: body.token,
      expiresAt: body.expiresAt,
      user: body.user ? normalizeUser(body.user) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export async function loginStoreCustomer(input: {
  email: string;
  password: string;
}): Promise<StoreCustomerAuthResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      token?: string;
      expiresAt?: string;
      user?: RawStoreCustomerUser;
    }>("/public/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo iniciar sesión.",
      };
    }

    return {
      ok: true,
      token: body.token,
      expiresAt: body.expiresAt,
      user: body.user ? normalizeUser(body.user) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export async function fetchStoreCustomerSession(token: string): Promise<StoreCustomerSessionResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      user?: RawStoreCustomerUser;
    }>("/public/auth/me.php", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "Sesión inválida.",
      };
    }

    return {
      ok: true,
      user: body.user ? normalizeUser(body.user) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo validar la sesión.",
    };
  }
}

export async function logoutStoreCustomer(token: string): Promise<StoreCustomerLogoutResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
    }>("/public/auth/logout.php", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo cerrar sesión.",
      };
    }

    return {
      ok: true,
      message: body.message ?? "Sesión cerrada.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}
