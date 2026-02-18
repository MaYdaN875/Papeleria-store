/**
 * Capa de acceso a API del panel admin.
 *
 * Objetivo:
 * - Centralizar requests a endpoints PHP de Hostinger.
 * - Normalizar tipos recibidos desde MySQL/PHP (que suelen venir como string).
 * - Evitar duplicar lógica de fetch y manejo de errores en componentes.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

interface AdminLoginResponse {
  ok: boolean;
  message?: string;
  token?: string;
  adminId?: number;
  expiresAt?: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  categoryId: number;
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

interface AdminProductUpdateResponse {
  ok: boolean;
  message?: string;
  product?: AdminProduct;
}

interface AdminProductCreateResponse {
  ok: boolean;
  message?: string;
  product?: AdminProduct;
}

interface AdminProductDeleteResponse {
  ok: boolean;
  message?: string;
  deletedId?: number;
}

interface AdminLogoutResponse {
  ok: boolean;
  message?: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  parentId: number | null;
  isActive: 0 | 1;
}

interface AdminCategoriesResponse {
  ok: boolean;
  message?: string;
  categories?: AdminCategory[];
}

type RawBinaryFlag = 0 | 1 | "0" | "1" | boolean;

interface RawAdminProduct {
  id: number | string;
  name: string;
  category_id?: number | string;
  price: number | string;
  stock: number | string;
  mayoreo: RawBinaryFlag;
  menudeo: RawBinaryFlag;
  category: string;
}

interface RawAdminCategory {
  id: number | string;
  name: string;
  parent_id?: number | string | null;
  is_active?: RawBinaryFlag;
}

/** Convierte cualquier representación booleana a 0/1 homogéneo para UI. */
function toBinaryFlag(value: RawAdminProduct["mayoreo"]): 0 | 1 {
  return value === 1 || value === "1" || value === true ? 1 : 0;
}

/** Normaliza respuesta cruda de PHP para usar tipos consistentes en React. */
function normalizeAdminProduct(raw: RawAdminProduct): AdminProduct {
  return {
    id: Number(raw.id) || 0,
    name: raw.name ?? "",
    categoryId: Number(raw.category_id) || 0,
    price: Number(raw.price) || 0,
    stock: Number(raw.stock) || 0,
    mayoreo: toBinaryFlag(raw.mayoreo),
    menudeo: toBinaryFlag(raw.menudeo),
    category: raw.category ?? "",
  };
}

function normalizeAdminCategory(raw: RawAdminCategory): AdminCategory {
  return {
    id: Number(raw.id) || 0,
    name: raw.name ?? "",
    parentId: raw.parent_id === null || raw.parent_id === undefined ? null : Number(raw.parent_id),
    isActive: toBinaryFlag(raw.is_active ?? 1),
  };
}

/** Login admin contra endpoint PHP. */
export async function adminLoginRequest(password: string): Promise<AdminLoginResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_login.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

function buildAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/** Obtiene lista de productos desde MySQL a través de PHP. */
export async function fetchAdminProducts(token: string): Promise<AdminProductsResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_products_list.php`, {
    headers: buildAuthHeaders(token),
  });

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

/** Obtiene categorías para formulario de alta de producto. */
export async function fetchAdminCategories(token: string): Promise<AdminCategoriesResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_categories_list.php`, {
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminCategoriesResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudieron cargar las categorías.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    categories?: RawAdminCategory[];
  };

  if (!body.ok) {
    return {
      ok: false,
      message: body.message ?? "No se pudieron cargar las categorías.",
    };
  }

  return {
    ok: true,
    message: body.message,
    categories: (body.categories ?? []).map(normalizeAdminCategory),
  };
}

export interface UpdateAdminProductInput {
  id: number;
  name: string;
  price: number;
  stock: number;
  mayoreo: 0 | 1;
  menudeo: 0 | 1;
}

export interface CreateAdminProductInput {
  categoryId: number;
  name: string;
  price: number;
  stock: number;
  mayoreo: 0 | 1;
  menudeo: 0 | 1;
}

export interface DeleteAdminProductInput {
  id: number;
}

/** Actualiza un producto existente en MySQL vía endpoint PHP. */
export async function updateAdminProduct(
  payload: UpdateAdminProductInput,
  token: string
): Promise<AdminProductUpdateResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_product_update.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminProductUpdateResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo actualizar el producto.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    product?: RawAdminProduct;
  };

  if (!body.ok || !body.product) {
    return {
      ok: false,
      message: body.message ?? "No se pudo actualizar el producto.",
    };
  }

  return {
    ok: true,
    message: body.message ?? "Producto actualizado.",
    product: normalizeAdminProduct(body.product),
  };
}

/** Crea producto nuevo en MySQL y devuelve la fila creada para refrescar UI. */
export async function createAdminProduct(
  payload: CreateAdminProductInput,
  token: string
): Promise<AdminProductCreateResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_product_create.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      category_id: payload.categoryId,
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      mayoreo: payload.mayoreo,
      menudeo: payload.menudeo,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminProductCreateResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo crear el producto.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    product?: RawAdminProduct;
  };

  if (!body.ok || !body.product) {
    return {
      ok: false,
      message: body.message ?? "No se pudo crear el producto.",
    };
  }

  return {
    ok: true,
    message: body.message ?? "Producto creado correctamente.",
    product: normalizeAdminProduct(body.product),
  };
}

/** Elimina físicamente un producto en MySQL. */
export async function deleteAdminProduct(
  payload: DeleteAdminProductInput,
  token: string
): Promise<AdminProductDeleteResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_product_delete.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminProductDeleteResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo eliminar el producto.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    deletedId?: number;
  };

  if (!body.ok || !body.deletedId) {
    return {
      ok: false,
      message: body.message ?? "No se pudo eliminar el producto.",
    };
  }

  return {
    ok: true,
    message: body.message ?? "Producto eliminado correctamente.",
    deletedId: body.deletedId,
  };
}

/** Cierra sesión en backend revocando token actual. */
export async function adminLogoutRequest(token: string): Promise<AdminLogoutResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin_logout.php`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminLogoutResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo cerrar sesión en el servidor.",
    };
  }

  const body = (await response.json()) as AdminLogoutResponse;
  return body;
}

