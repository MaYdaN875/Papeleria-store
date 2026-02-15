/** Modelo de producto usado en listados, detalle, carruseles y búsqueda. */
export type Product = {
    id: number
    name: string
    price: number
    category: string
    description: string
    image: string
    stock: number
    mayoreo?: boolean
    menudeo?: boolean
}
