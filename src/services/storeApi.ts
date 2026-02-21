import type { Product } from "../types/Product"
import type { StoreHomeSlide, StoreHomeSlidesResponse, StoreProductsResponse } from "../types/store"
import { buildCandidateApiBases, getApiBase } from "./api/base"

export type { StoreHomeSlide, StoreHomeSlidesResponse, StoreProductsResponse } from "../types/store"
const API_BASE = getApiBase()

type BinaryLike = 0 | 1 | "0" | "1" | boolean

interface RawStoreProduct {
    id: number | string
    name: string
    category: string
    description?: string | null
    image?: string | null
    stock: number | string
    mayoreo?: BinaryLike
    menudeo?: BinaryLike
    home_carousel_slot?: number | string
    is_offer?: BinaryLike
    original_price?: number | string
    offer_price?: number | string | null
    final_price?: number | string
    discount_percentage?: number | string
    price?: number | string
}

interface RawStoreHomeSlide {
    id: number | string
    image_url: string
    display_order?: number | string
}

function toBooleanFlag(value: RawStoreProduct["mayoreo"]): boolean {
    return value === 1 || value === "1" || value === true
}

function resolveStoreImageUrl(value: string | null | undefined, apiBase: string): string {
    const fallbackImage = "/images/boligrafos.jpg"
    const image = (value ?? "").trim()
    if (!image) return fallbackImage

    if (/^https?:\/\//i.test(image)) return image

    if (image.startsWith("/api/") || image.startsWith("/uploads/")) {
        try {
            const baseOrigin = new URL(apiBase).origin
            return `${baseOrigin}${image}`
        } catch {
            return image
        }
    }

    return image
}

function normalizeStoreProduct(raw: RawStoreProduct, apiBase: string): Product {
    const finalPrice = Number(raw.final_price ?? raw.price) || 0
    const originalPrice = Number(raw.original_price ?? raw.price ?? raw.final_price) || finalPrice
    const hasDiscount = originalPrice > finalPrice

    return {
        id: Number(raw.id) || 0,
        name: raw.name ?? "",
        category: raw.category ?? "General",
        description: raw.description ?? "Producto disponible en tienda",
        image: resolveStoreImageUrl(raw.image, apiBase),
        stock: Number(raw.stock) || 0,
        mayoreo: toBooleanFlag(raw.mayoreo),
        menudeo: toBooleanFlag(raw.menudeo),
        homeCarouselSlot: (() => {
            const rawSlot = Number(raw.home_carousel_slot ?? 0) || 0
            return rawSlot >= 1 && rawSlot <= 3 ? rawSlot : 0
        })(),
        isOffer: toBooleanFlag(raw.is_offer),
        price: finalPrice,
        originalPrice: hasDiscount ? originalPrice : undefined,
        discountPercentage: hasDiscount
            ? Number(raw.discount_percentage) || Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
            : undefined,
    }
}

function normalizeStoreHomeSlide(raw: RawStoreHomeSlide, apiBase: string): StoreHomeSlide {
    return {
        id: Number(raw.id) || 0,
        imageUrl: resolveStoreImageUrl(raw.image_url, apiBase),
        displayOrder: Number(raw.display_order) || 1,
    }
}

export async function fetchStoreProducts(): Promise<StoreProductsResponse> {
    const candidateBases = buildCandidateApiBases(API_BASE)
    if (candidateBases.length === 0 || !candidateBases[0]) {
        return {
            ok: false,
            message: "VITE_API_URL no está configurada.",
        }
    }

    let lastNetworkError = ""

    for (const base of candidateBases) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)
            const response = await fetch(`${base}/public/products.php`, { signal: controller.signal })
            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorBody = (await response.json().catch(() => ({}))) as Partial<StoreProductsResponse>
                return {
                    ok: false,
                    message: errorBody.message ?? "No se pudieron cargar los productos de la tienda.",
                }
            }

            const body = (await response.json()) as {
                ok: boolean
                message?: string
                products?: RawStoreProduct[]
            }

            if (!body.ok) {
                return {
                    ok: false,
                    message: body.message ?? "No se pudieron cargar los productos de la tienda.",
                }
            }

            return {
                ok: true,
                message: body.message,
                products: (body.products ?? []).map((product) => normalizeStoreProduct(product, base)),
            }
        } catch (error) {
            lastNetworkError = error instanceof Error ? error.message : "Error de red desconocido"
        }
    }

    return {
        ok: false,
        message: `No se pudo conectar a la API de tienda. ${lastNetworkError}`,
    }
}

export async function fetchStoreHomeSlides(): Promise<StoreHomeSlidesResponse> {
    const candidateBases = buildCandidateApiBases(API_BASE)
    if (candidateBases.length === 0 || !candidateBases[0]) {
        return {
            ok: false,
            message: "VITE_API_URL no está configurada.",
        }
    }

    let lastNetworkError = ""

    for (const base of candidateBases) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)
            const response = await fetch(`${base}/public/slides.php`, { signal: controller.signal })
            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorBody = (await response.json().catch(() => ({}))) as Partial<StoreHomeSlidesResponse>
                return {
                    ok: false,
                    message: errorBody.message ?? "No se pudieron cargar los slides de home.",
                }
            }

            const body = (await response.json()) as {
                ok: boolean
                message?: string
                slides?: RawStoreHomeSlide[]
            }

            if (!body.ok) {
                return {
                    ok: false,
                    message: body.message ?? "No se pudieron cargar los slides de home.",
                }
            }

            return {
                ok: true,
                message: body.message,
                slides: (body.slides ?? []).map((slide) => normalizeStoreHomeSlide(slide, base)),
            }
        } catch (error) {
            lastNetworkError = error instanceof Error ? error.message : "Error de red desconocido"
        }
    }

    return {
        ok: false,
        message: `No se pudo conectar a la API de slides. ${lastNetworkError}`,
    }
}
