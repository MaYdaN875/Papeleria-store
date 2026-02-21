/**
 * Caché global de productos de la tienda.
 *
 * Centraliza la llamada a `fetchStoreProducts` para que la app
 * solo haga **una** petición HTTP independientemente de cuántos
 * componentes (Home, AllProducts, Navbar) la necesiten.
 *
 * Incluye un TTL de 60 s para refrescar datos periódicamente.
 */

import { fetchStoreProducts, type StoreProductsResponse } from "./storeApi"

const CACHE_TTL_MS = 60_000 // 60 segundos

let cachedPromise: Promise<StoreProductsResponse> | null = null
let cachedAt = 0

function isCacheValid(): boolean {
    return cachedPromise !== null && Date.now() - cachedAt < CACHE_TTL_MS
}

/**
 * Devuelve los productos de la tienda.
 * Si ya hay una petición en vuelo o resultado reciente, reutiliza esa promesa.
 */
export function getStoreProducts(): Promise<StoreProductsResponse> {
    if (isCacheValid()) return cachedPromise!

    cachedAt = Date.now()
    cachedPromise = fetchStoreProducts().catch((error) => {
        // Limpiar caché para reintentar en la siguiente llamada
        cachedPromise = null
        cachedAt = 0
        throw error
    })

    return cachedPromise
}

/** Fuerza una recarga en la siguiente llamada (ej. después de editar productos en admin). */
export function invalidateProductCache(): void {
    cachedPromise = null
    cachedAt = 0
}
