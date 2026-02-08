import Fuse, { type FuseResult } from "fuse.js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { expandSearchWithSynonyms } from "../data/synonyms"
import type { Product } from "../types/Product"
import { useDebounce } from "./useDebounce"

export interface UseProductSearchOptions {
    /** Lista de productos donde buscar */
    products: Product[]
    /** Campos por los que buscar (default: name, category, description) */
    searchFields?: (keyof Product)[]
    /** Umbral de fuzzy match: 0 = exacto, 1 = acepta todo (default: 0.3 para mayor tolerancia a typos) */
    threshold?: number
    /** Máximo de resultados a mostrar (default: 10) */
    limit?: number
    /** Delay en ms antes de ejecutar la búsqueda (default: 200) */
    debounceMs?: number
}

export interface UseProductSearchReturn {
    searchQuery: string
    searchResults: Product[]
    showResults: boolean
    searchBoxRef: React.RefObject<HTMLDivElement>
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleResultClick: () => void
    setShowResults: (show: boolean) => void
}

const DEFAULT_SEARCH_FIELDS: (keyof Product)[] = ["name", "category", "description"]

/**
 * Función auxiliar para filtrar productos por búsqueda usando Fuse.js
 * Reutilizable en componentes (como AllProducts) para filtrar resultados
 * 
 * @param products - Lista de productos a buscar
 * @param query - Término de búsqueda
 * @param searchFields - Campos donde buscar (default: name, category, description)
 * @param threshold - Umbral de fuzzy match (default: 0.4)
 * @returns Array de productos que coinciden con la búsqueda
 */
export function filterProductsBySearch(
    products: Product[],
    query: string,
    searchFields: (keyof Product)[] = DEFAULT_SEARCH_FIELDS,
    threshold: number = 0.4
): Product[] {
    if (!query.trim()) return products

    const fuse = new Fuse(products, {
        keys: searchFields as string[],
        threshold,
        includeScore: true,
    })

    const results = fuse.search(query.toLowerCase()) as FuseResult<Product>[]
    return results.map((item: FuseResult<Product>) => item.item)
}

/**
 * Hook para búsqueda difusa de productos con Fuse.js.
 * Usa debounce para no ejecutar búsqueda en cada keystroke.
 */
export function useProductSearch({
    products,
    searchFields = DEFAULT_SEARCH_FIELDS,
    threshold = 0.3,
    limit = 10,
    debounceMs = 200,
}: UseProductSearchOptions): UseProductSearchReturn {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [showResults, setShowResults] = useState(false)
    const searchBoxRef = useRef<HTMLDivElement>(null)

    const debouncedQuery = useDebounce(searchQuery.trim().toLowerCase(), debounceMs)

    const fuse = useMemo(
        () =>
            new Fuse(products, {
                keys: searchFields as string[],
                threshold,
                includeScore: true,
            }),
        [products, searchFields, threshold]
    )

    useEffect(() => {
        if (debouncedQuery.length > 0) {
            // Expandir búsqueda con sinónimos
            const expandedQuery = expandSearchWithSynonyms(debouncedQuery)
            const found = fuse.search(expandedQuery) as FuseResult<Product>[]
            const results = found.slice(0, limit).map((item: FuseResult<Product>) => item.item)
            setSearchResults(results)
            setShowResults(true)
        } else {
            setSearchResults([])
            setShowResults(false)
        }
    }, [debouncedQuery, fuse, limit])

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        if (value.trim().length === 0) {
            setSearchResults([])
            setShowResults(false)
        }
    }, [])

    const handleResultClick = useCallback(() => {
        setSearchQuery("")
        setSearchResults([])
        setShowResults(false)
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchBoxRef.current &&
                !searchBoxRef.current.contains(e.target as Node)
            ) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return {
        searchQuery,
        searchResults,
        showResults,
        searchBoxRef,
        handleSearch,
        handleResultClick,
        setShowResults,
    }
}
