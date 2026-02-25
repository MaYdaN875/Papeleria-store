import type {
    StoreCustomerAuthResponse,
    StoreCustomerLogoutResponse,
    StoreCustomerSessionResponse,
    StoreEmailVerificationResponse,
    StorePasswordResetResponse,
} from "../types/customer";
import { buildCandidateApiBases, getApiBase } from "./api/base";

const API_BASE = getApiBase();

interface RawStoreCustomerUser {
  id: number | string;
  name: string;
  email: string;
}

function parseRetryAfterSeconds(response: Response, bodyRetryAfterSeconds?: number): number | undefined {
  if (typeof bodyRetryAfterSeconds === "number" && bodyRetryAfterSeconds > 0) {
    return Math.ceil(bodyRetryAfterSeconds);
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  if (!retryAfterHeader) return undefined;

  const parsed = Number(retryAfterHeader);
  if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed);

  return undefined;
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
  recaptchaToken?: string | null;
}): Promise<StoreCustomerAuthResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      retryAfterSeconds?: number;
      requiresEmailVerification?: boolean;
      token?: string;
      expiresAt?: string;
      user?: RawStoreCustomerUser;
    }>("/public/auth/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        password: input.password,
        recaptcha_token: input.recaptchaToken ?? undefined,
      }),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo completar el registro.",
        retryAfterSeconds: parseRetryAfterSeconds(response, body.retryAfterSeconds),
        requiresEmailVerification: body.requiresEmailVerification ?? false,
      };
    }

    return {
      ok: true,
      message: body.message,
      requiresEmailVerification: body.requiresEmailVerification ?? false,
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
  recaptchaToken?: string | null;
}): Promise<StoreCustomerAuthResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      retryAfterSeconds?: number;
      requiresEmailVerification?: boolean;
      token?: string;
      expiresAt?: string;
      user?: RawStoreCustomerUser;
    }>("/public/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        recaptcha_token: input.recaptchaToken ?? undefined,
      }),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo iniciar sesión.",
        retryAfterSeconds: parseRetryAfterSeconds(response, body.retryAfterSeconds),
        requiresEmailVerification: body.requiresEmailVerification ?? false,
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

export async function requestStorePasswordReset(input: {
  email: string;
}): Promise<StorePasswordResetResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      retryAfterSeconds?: number;
    }>("/public/auth/forgot_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo enviar la solicitud de recuperacion.",
        retryAfterSeconds: parseRetryAfterSeconds(response, body.retryAfterSeconds),
      };
    }

    return {
      ok: true,
      message: body.message ?? "Revisa tu correo para continuar.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export async function applyStorePasswordReset(input: {
  token: string;
  password: string;
}): Promise<StorePasswordResetResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      retryAfterSeconds?: number;
    }>("/public/auth/reset_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo actualizar la contrasena.",
        retryAfterSeconds: parseRetryAfterSeconds(response, body.retryAfterSeconds),
      };
    }

    return {
      ok: true,
      message: body.message ?? "Contrasena actualizada correctamente.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export async function resendStoreEmailVerification(input: {
  email: string;
}): Promise<StoreEmailVerificationResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      retryAfterSeconds?: number;
    }>("/public/auth/resend_verification.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo reenviar el correo de verificacion.",
        retryAfterSeconds: parseRetryAfterSeconds(response, body.retryAfterSeconds),
      };
    }

    return {
      ok: true,
      message: body.message ?? "Si aplica, enviamos un nuevo enlace de verificacion.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export async function verifyStoreCustomerEmail(input: {
  token: string;
}): Promise<StoreEmailVerificationResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      retryAfterSeconds?: number;
    }>("/public/auth/verify_email.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo verificar el correo.",
        retryAfterSeconds: parseRetryAfterSeconds(response, body.retryAfterSeconds),
      };
    }

    return {
      ok: true,
      message: body.message ?? "Correo verificado correctamente.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export interface StoreCartItemData {
  product_id: number;
  quantity: number;
  name?: string;
  price?: string;
}

export interface StoreCartGetResponse {
  ok: boolean;
  message?: string;
  items?: StoreCartItemData[];
}

export interface StoreCartSyncResponse {
  ok: boolean;
  message?: string;
}

export async function fetchStoreCart(token: string): Promise<StoreCartGetResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      items?: StoreCartItemData[];
    }>("/public/cart/get.php", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo obtener el carrito.",
      };
    }

    return {
      ok: true,
      items: Array.isArray(body.items) ? body.items : [],
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

export async function syncStoreCart(
  token: string,
  items: Array<{ product_id: number; quantity: number }>
): Promise<StoreCartSyncResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
    }>("/public/cart/update.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo sincronizar el carrito.",
      };
    }

    return {
      ok: true,
      message: body.message ?? "Carrito sincronizado.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

/** Respuesta de crear sesión de Stripe Checkout */
export interface CreateCheckoutSessionResponse {
  ok: boolean;
  message?: string;
  url?: string;
  sessionId?: string;
  orderId?: number;
}

/**
 * Crea una sesión de Stripe Checkout para el carrito. Requiere usuario autenticado con la API (Bearer).
 * Redirige al usuario a la URL devuelta para pagar.
 */
export async function createCheckoutSession(
  token: string,
  input: {
    items: Array<{ product_id: number; quantity: number }>;
    success_url?: string;
    cancel_url?: string;
  }
): Promise<CreateCheckoutSessionResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      url?: string;
      sessionId?: string;
      orderId?: number;
    }>("/public/checkout/create-session.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: input.items,
        success_url: input.success_url ?? undefined,
        cancel_url: input.cancel_url ?? undefined,
      }),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo crear la sesión de pago.",
      };
    }

    return {
      ok: true,
      url: body.url,
      sessionId: body.sessionId,
      orderId: body.orderId,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con la API.",
    };
  }
}

/**
 * Envía el token de Firebase al backend para verificarlo, crear/vincular
 * usuario en la BD local y obtener un token de API (Bearer) válido para pagos.
 */
export async function loginWithFirebaseToken(
  firebaseToken: string
): Promise<StoreCustomerAuthResponse> {
  try {
    const { response, body } = await requestWithBaseFallback<{
      ok?: boolean;
      message?: string;
      token?: string;
      expiresAt?: string;
      user?: RawStoreCustomerUser;
    }>("/public/auth/firebase_login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_token: firebaseToken }),
    });

    if (!response.ok || !body.ok) {
      return {
        ok: false,
        message: body.message ?? "No se pudo iniciar sesión con Google.",
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
