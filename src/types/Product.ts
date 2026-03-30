/** Modelo de producto usado en listados, detalle, carruseles y búsqueda. */
export type Product = {
    id: number
    name: string
    price: number
    originalPrice?: number
    discountPercentage?: number
    isOffer?: boolean
    category: string
    description: string
    brand?: string
    image: string
    stock: number
    mayoreo?: boolean
    menudeo?: boolean
    mayoreoPrice?: number | null
    mayoreoStock?: number
    mayoreoMinQty?: number
    menudeoPrice?: number | null
    menudeoStock?: number
    menudeoMinQty?: number
    categorySlug?: string
    parentCategory?: string
    parentCategorySlug?: string
    homeCarouselSlot?: number
}
