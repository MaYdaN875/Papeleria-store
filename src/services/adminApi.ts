/**
 * Capa de acceso a API del panel admin.
 *
 * Objetivo:
 * - Centralizar requests a endpoints PHP de Hostinger.
 * - Normalizar tipos recibidos desde MySQL/PHP (que suelen venir como string).
 * - Evitar duplicar lógica de fetch y manejo de errores en componentes.
 */
import type {
    AdminCategory,
    AdminHomeSlide,
    AdminOffer,
    AdminProduct,
    AdminSalesProductRow,
    AdminSalesTodaySummary,
    CreateAdminHomeSlideInput,
    CreateAdminProductInput,
    DeleteAdminHomeSlideInput,
    DeleteAdminProductInput,
    RemoveAdminOfferInput,
    UpdateAdminProductInput,
    UpsertAdminOfferInput,
} from "../types/admin";
import { buildAuthHeaders, getApiBase } from "./api/base";

export type {
    AdminCategory,
    AdminHomeSlide,
    AdminOffer,
    AdminProduct,
    AdminSalesProductRow,
    AdminSalesTodaySummary,
    CreateAdminHomeSlideInput,
    CreateAdminProductInput,
    DeleteAdminHomeSlideInput,
    DeleteAdminProductInput,
    RemoveAdminOfferInput,
    UpdateAdminProductInput,
    UpsertAdminOfferInput
} from "../types/admin";

const API_BASE = getApiBase();

interface AdminLoginResponse {
  ok: boolean;
  message?: string;
  token?: string;
  adminId?: number;
  expiresAt?: string;
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

interface AdminImageUploadResponse {
  ok: boolean;
  message?: string;
  imageUrl?: string;
}

interface AdminOffersResponse {
  ok: boolean;
  message?: string;
  offers?: AdminOffer[];
}

interface AdminOfferMutationResponse {
  ok: boolean;
  message?: string;
  offer?: AdminOffer;
}

interface AdminSalesTodayResponse {
  ok: boolean;
  message?: string;
  summary?: AdminSalesTodaySummary;
  products?: AdminSalesProductRow[];
}

interface AdminHomeSlidesResponse {
  ok: boolean;
  message?: string;
  slides?: AdminHomeSlide[];
}

interface AdminHomeSlideMutationResponse {
  ok: boolean;
  message?: string;
  slide?: AdminHomeSlide;
  deletedId?: number;
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
  image?: string;
  mayoreo: RawBinaryFlag;
  menudeo: RawBinaryFlag;
  mayoreo_price?: number | string | null;
  mayoreo_stock?: number | string;
  menudeo_price?: number | string | null;
  menudeo_stock?: number | string;
  home_carousel_slot?: number | string;
  category: string;
  is_offer?: RawBinaryFlag;
  offer_price?: number | string | null;
}

interface RawAdminCategory {
  id: number | string;
  name: string;
  parent_id?: number | string | null;
  is_active?: RawBinaryFlag;
}

interface RawAdminOffer {
  product_id: number | string;
  product_name: string;
  category: string;
  original_price: number | string;
  offer_price: number | string;
  stock: number | string;
}

interface RawAdminSalesTodaySummary {
  total_revenue: number | string;
  total_units: number | string;
  total_orders: number | string;
}

interface RawAdminSalesProductRow {
  product_id: number | string;
  product_name: string;
  total_units: number | string;
  total_revenue: number | string;
  total_orders: number | string;
}

interface RawAdminHomeSlide {
  id: number | string;
  image_url: string;
  is_active?: RawBinaryFlag;
  display_order?: number | string;
}

/** Convierte cualquier representación booleana a 0/1 homogéneo para UI. */
function toBinaryFlag(value: RawBinaryFlag | undefined): 0 | 1 {
  return value === 1 || value === "1" || value === true ? 1 : 0;
}

/** Normaliza respuesta cruda de PHP para usar tipos consistentes en React. */
function normalizeAdminProduct(raw: RawAdminProduct): AdminProduct {
  const rawSlot = Number(raw.home_carousel_slot ?? 0) || 0;
  const homeCarouselSlot = rawSlot >= 1 && rawSlot <= 3 ? (rawSlot as 1 | 2 | 3) : 0;

  return {
    id: Number(raw.id) || 0,
    name: raw.name ?? "",
    categoryId: Number(raw.category_id) || 0,
    price: Number(raw.price) || 0,
    stock: Number(raw.stock) || 0,
    image: raw.image ?? "/images/boligrafos.jpg",
    mayoreo: toBinaryFlag(raw.mayoreo),
    menudeo: toBinaryFlag(raw.menudeo),
    mayoreoPrice:
      raw.mayoreo_price === null || raw.mayoreo_price === undefined ? null : Number(raw.mayoreo_price) || 0,
    mayoreoStock: Number(raw.mayoreo_stock) || 0,
    menudeoPrice:
      raw.menudeo_price === null || raw.menudeo_price === undefined ? null : Number(raw.menudeo_price) || 0,
    menudeoStock: Number(raw.menudeo_stock) || 0,
    homeCarouselSlot,
    category: raw.category ?? "",
    isOffer: toBinaryFlag(raw.is_offer),
    offerPrice:
      raw.offer_price === null || raw.offer_price === undefined ? null : Number(raw.offer_price) || 0,
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

function normalizeAdminOffer(raw: RawAdminOffer): AdminOffer {
  return {
    productId: Number(raw.product_id) || 0,
    productName: raw.product_name ?? "",
    category: raw.category ?? "",
    originalPrice: Number(raw.original_price) || 0,
    offerPrice: Number(raw.offer_price) || 0,
    stock: Number(raw.stock) || 0,
  };
}

function normalizeAdminSalesSummary(raw: RawAdminSalesTodaySummary): AdminSalesTodaySummary {
  return {
    totalRevenue: Number(raw.total_revenue) || 0,
    totalUnits: Number(raw.total_units) || 0,
    totalOrders: Number(raw.total_orders) || 0,
  };
}

function normalizeAdminSalesProductRow(raw: RawAdminSalesProductRow): AdminSalesProductRow {
  return {
    productId: Number(raw.product_id) || 0,
    productName: raw.product_name ?? "",
    totalUnits: Number(raw.total_units) || 0,
    totalRevenue: Number(raw.total_revenue) || 0,
    totalOrders: Number(raw.total_orders) || 0,
  };
}

function normalizeAdminHomeSlide(raw: RawAdminHomeSlide): AdminHomeSlide {
  return {
    id: Number(raw.id) || 0,
    imageUrl: raw.image_url ?? "",
    isActive: toBinaryFlag(raw.is_active ?? 1),
    displayOrder: Number(raw.display_order) || 1,
  };
}

/** Login admin contra endpoint PHP. */
export async function adminLoginRequest(userIdentifier: string, password: string): Promise<AdminLoginResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/auth/login.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: userIdentifier,
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

/** Obtiene lista de productos desde MySQL a través de PHP. */
export async function fetchAdminProducts(token: string): Promise<AdminProductsResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/products/list.php`, {
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

  const response = await fetch(`${API_BASE}/admin/categories/list.php`, {
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

  const response = await fetch(`${API_BASE}/admin/products/update.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      id: payload.id,
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      image_url: payload.imageUrl,
      mayoreo: payload.mayoreo,
      menudeo: payload.menudeo,
      mayoreo_price: payload.mayoreoPrice,
      mayoreo_stock: payload.mayoreoStock,
      menudeo_price: payload.menudeoPrice,
      menudeo_stock: payload.menudeoStock,
      home_carousel_slot: payload.homeCarouselSlot,
    }),
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

  const response = await fetch(`${API_BASE}/admin/products/create.php`, {
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
      image_url: payload.imageUrl,
      mayoreo: payload.mayoreo,
      menudeo: payload.menudeo,
      mayoreo_price: payload.mayoreoPrice,
      mayoreo_stock: payload.mayoreoStock,
      menudeo_price: payload.menudeoPrice,
      menudeo_stock: payload.menudeoStock,
      home_carousel_slot: payload.homeCarouselSlot,
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

  const response = await fetch(`${API_BASE}/admin/products/delete.php`, {
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

  const response = await fetch(`${API_BASE}/admin/auth/logout.php`, {
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

/** Sube una imagen del producto al servidor y devuelve su URL pública. */
export async function uploadAdminProductImage(
  imageFile: File,
  token: string
): Promise<AdminImageUploadResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_BASE}/admin/products/image_upload.php`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminImageUploadResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo subir la imagen del producto.",
    };
  }

  const body = (await response.json()) as AdminImageUploadResponse;
  return body;
}

/** Lista slides configurados para el banner principal del home. */
export async function fetchAdminHomeSlides(token: string): Promise<AdminHomeSlidesResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/slides/list.php`, {
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminHomeSlidesResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudieron cargar los slides del home.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    slides?: RawAdminHomeSlide[];
  };

  if (!body.ok) {
    return {
      ok: false,
      message: body.message ?? "No se pudieron cargar los slides del home.",
    };
  }

  return {
    ok: true,
    message: body.message,
    slides: (body.slides ?? []).map(normalizeAdminHomeSlide),
  };
}

/** Crea un slide del banner home con imagen completa. */
export async function createAdminHomeSlide(
  payload: CreateAdminHomeSlideInput,
  token: string
): Promise<AdminHomeSlideMutationResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/slides/create.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      image_url: payload.imageUrl,
      display_order: payload.displayOrder,
      is_active: payload.isActive ?? 1,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminHomeSlideMutationResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo crear el slide.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    slide?: RawAdminHomeSlide;
  };

  if (!body.ok || !body.slide) {
    return {
      ok: false,
      message: body.message ?? "No se pudo crear el slide.",
    };
  }

  return {
    ok: true,
    message: body.message ?? "Slide creado correctamente.",
    slide: normalizeAdminHomeSlide(body.slide),
  };
}

/** Elimina un slide del home por id. */
export async function deleteAdminHomeSlide(
  payload: DeleteAdminHomeSlideInput,
  token: string
): Promise<AdminHomeSlideMutationResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/slides/delete.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      id: payload.id,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminHomeSlideMutationResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo eliminar el slide.",
    };
  }

  const body = (await response.json()) as AdminHomeSlideMutationResponse;
  return body;
}

/** Lista de productos que están en oferta actualmente. */
export async function fetchAdminOffers(token: string): Promise<AdminOffersResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/offers/list.php`, {
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminOffersResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudieron cargar las ofertas.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    offers?: RawAdminOffer[];
  };

  if (!body.ok) {
    return {
      ok: false,
      message: body.message ?? "No se pudieron cargar las ofertas.",
    };
  }

  return {
    ok: true,
    message: body.message,
    offers: (body.offers ?? []).map(normalizeAdminOffer),
  };
}

/** Crea o actualiza una oferta para un producto específico. */
export async function upsertAdminOffer(
  payload: UpsertAdminOfferInput,
  token: string
): Promise<AdminOfferMutationResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/offers/upsert.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      product_id: payload.productId,
      offer_price: payload.offerPrice,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminOfferMutationResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo guardar la oferta.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    offer?: RawAdminOffer;
  };

  if (!body.ok || !body.offer) {
    return {
      ok: false,
      message: body.message ?? "No se pudo guardar la oferta.",
    };
  }

  return {
    ok: true,
    message: body.message ?? "Oferta guardada correctamente.",
    offer: normalizeAdminOffer(body.offer),
  };
}

/** Quita una oferta existente sin borrar el producto original. */
export async function removeAdminOffer(
  payload: RemoveAdminOfferInput,
  token: string
): Promise<AdminOfferMutationResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/offers/remove.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      product_id: payload.productId,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminOfferMutationResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudo quitar la oferta.",
    };
  }

  const body = (await response.json()) as AdminOfferMutationResponse;
  return body;
}

/** Consulta ventas del día para módulo de ingresos del admin. */
export async function fetchAdminSalesToday(token: string): Promise<AdminSalesTodayResponse> {
  if (!API_BASE) {
    return {
      ok: false,
      message: "Falta configurar VITE_API_URL para conectar con PHP.",
    };
  }

  const response = await fetch(`${API_BASE}/admin/sales/today.php`, {
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<AdminSalesTodayResponse>;
    return {
      ok: false,
      message: errorBody.message ?? "No se pudieron cargar los ingresos del día.",
    };
  }

  const body = (await response.json()) as {
    ok: boolean;
    message?: string;
    summary?: RawAdminSalesTodaySummary;
    products?: RawAdminSalesProductRow[];
  };

  if (!body.ok) {
    return {
      ok: false,
      message: body.message ?? "No se pudieron cargar los ingresos del día.",
    };
  }

  return {
    ok: true,
    message: body.message,
    summary: normalizeAdminSalesSummary(
      body.summary ?? {
        total_revenue: 0,
        total_units: 0,
        total_orders: 0,
      }
    ),
    products: (body.products ?? []).map(normalizeAdminSalesProductRow),
  };
}

