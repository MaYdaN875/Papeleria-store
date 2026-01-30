import { useCallback, useEffect, useMemo, useState } from "react"
import { CategoryFilters } from "../components/CategoryFilters"
import { PageHeader } from "../components/PageHeader"
import { ProductCard } from "../components/ProductCard"
import { products } from "../data/products"
import { addProductToCart, syncCartCount } from "../utils/cart"

/* ================================
   COMPONENTE: AllProducts
   Página completa con todos los productos y filtros por categoría
   ================================ */

const CATEGORY_TO_FILTER_ID: Record<string, string> = {
    Escolar: "escolares",
    Escritura: "escritura",
    Papelería: "papeleria",
    Arte: "arte",
}

const BRANDS: Record<number, string> = {
    1: "Staedtler",
    2: "Moleskine",
    3: "Copic",
    4: "Faber-Castell",
    5: "Canson",
    6: "Esselte",
}

const BADGES: Record<number, { type: "discount" | "sale"; value: string }> = {
    1: { type: "discount", value: "-20%" },
    2: { type: "sale", value: "HOT" },
    3: { type: "discount", value: "-15%" },
    4: { type: "discount", value: "-25%" },
    5: { type: "sale", value: "NUEVO" },
    6: { type: "discount", value: "-10%" },
}

const ORIGINAL_PRICES: Record<number, number> = {
    1: 89.99,
    3: 120,
    4: 150,
    6: 55,
}

export const AllProducts = () => {
    const [categoryFilter, setCategoryFilter] = useState<string>("todos")

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        syncCartCount()
    }, [])

    const filteredProducts = useMemo(() => {
        if (categoryFilter === "todos") return products
        return products.filter((p) => CATEGORY_TO_FILTER_ID[p.category] === categoryFilter)
    }, [categoryFilter])

    const handleFilter = useCallback((categoryId: string) => {
        setCategoryFilter(categoryId)
    }, [])

    return (
        <>
            <PageHeader
                backTo="/"
                title="Todos Nuestros Productos"
                subtitle="Explora nuestro catálogo completo por categoría"
            />

            <section className="all-products-section">
                <CategoryFilters onFilter={handleFilter} />

                <div className="all-products-grid" id="allProductsGrid">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            badge={BADGES[product.id]}
                            originalPrice={ORIGINAL_PRICES[product.id]}
                            brand={BRANDS[product.id]}
                            rating={4.5}
                            onAddToCart={() =>
                                addProductToCart(product.name, product.price.toFixed(2))
                            }
                        />
                    ))}
                </div>
            </section>
        </>
    )
}
