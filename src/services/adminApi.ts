const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

interface AdminLoginResponse {
  ok: boolean;
  message?: string;
  token?: string;
  adminId?: number;
}

export interface AdminProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  mayoreo: 0 | 1;
  menudeo: 0 | 1;
  category: string;
}

interface AdminProductsResponse {
  ok: boolean;
  message?: string;
  products?: AdminProduct[];
}

interface RawAdminProduct {
  id: number | string;
  name: string;
  price: number | string;
  stock: number | string;
  mayoreo: 0 | 1 | "0" | "1" | boolean;
  menudeo: 0 | 1 | "0" | "1" | boolean;
  category: string;
}

function toBinaryFlag(value: RawAdminProduct["mayoreo"]): 0 | 1 {
  return value === 1 || value === "1" || value === true ? 1 : 0;
}

function normalizeAdminProduct(raw: RawAdminProduct): AdminProduct {
  return {
    id: Number(raw.id) || 0,
    name: raw.name ?? "",
    price: Number(raw.price) || 0,
    stock: Number(raw.stock) || 0,
    mayoreo: toBinaryFlag(raw.mayoreo),
    menudeo: toBinaryFlag(raw.menudeo),
    category: raw.category ?? "",
  };
}

export async function adminLoginRequest(password: string): Promise<AdminLoginResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_login.php`, {
    method: "POST",
    // Sin headers custom para evitar preflight OPTIONS en hosting compartido.
    body: JSON.stringify({
      email: "admin@godart.com",
      password,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminLoginResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo iniciar sesión en el servidor.",
    };
  }

  const body = (await response.json()) as AdminLoginResponse;
  return body;
}

export async function fetchAdminProducts(_token: string): Promise<AdminProductsResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_products_list.php`);

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminProductsResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudieron cargar los productos.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    products?: RawAdminProduct[];
  };

  if (!body.ok) {
    return {
      ok: false,
      message: body.message ?? "No se pudieron cargar los productos.",
    };
  }

  return {
    ok: true,
    message: body.message,
    products: (body.products ?? []).map(normalizeAdminProduct),
  };
}

