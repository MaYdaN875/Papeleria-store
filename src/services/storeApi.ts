import type { Product } from "../types/Product"

const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "")

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
    is_offer?: BinaryLike
    original_price?: number | string
    offer_price?: number | string | null
    final_price?: number | string
    discount_percentage?: number | string
    price?: number | string
}

interface StoreProductsResponse {
    ok: boolean
    message?: string
    products?: Product[]
}

function buildCandidateApiBases(base: string): string[] {
    const normalizedBase = base.trim().replace(/\/$/, "")
    if (!normalizedBase) return [""]

    const variants = new Set<string>([normalizedBase])
    variants.add(normalizedBase.replace("papelería", "papeleria"))
    variants.add(normalizedBase.replace("papeleria", "papelería"))
    variants.add(normalizedBase.replace("://www.", "://"))
    variants.add(normalizedBase.replace("://", "://www."))

    return Array.from(variants).filter((value) => value.length > 0)
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
        isOffer: toBooleanFlag(raw.is_offer),
        price: finalPrice,
        originalPrice: hasDiscount ? originalPrice : undefined,
        discountPercentage: hasDiscount
            ? Number(raw.discount_percentage) || Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
            : undefined,
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
            const response = await fetch(`${base}/products_list_public.php`)

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
