import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { FilterPanel, FilterState } from "../components/FilterPanel"
import { ProductCard, type ProductCardBadge } from "../components/ProductCard"
import { products } from "../data/products"
import type { Product } from "../types/Product"
import { addProductToCart, syncCartCount } from "../utils/cart"

/* ================================
   COMPONENTE: AllProducts
   Página completa con todos los productos y filtros por categoría
   ================================ */

function getBrand(product: Product): string {
    return product.description.split(" ")[0] ?? ""
}

function getBadgeForProduct(product: Product): ProductCardBadge | undefined {
    const remainder = product.id % 3
    if (remainder === 1) return { type: "discount", value: "-20%" }
    if (remainder === 2) return { type: "sale", value: "HOT" }
    if (remainder === 0) return { type: "discount", value: "-15%" }
    return undefined
}

function filterProducts(productsList: Product[], filters: FilterState): Product[] {
    return productsList.filter((product) => {
        const brand = getBrand(product)

        if (filters.brands.length > 0 && !filters.brands.includes(brand)) return false
        if (filters.mayoreo && !product.mayoreo) return false
        if (filters.menudeo && !product.menudeo) return false
        if (
            product.price < filters.priceRange[0] ||
            product.price > filters.priceRange[1]
        )
            return false

        return true
    })
}

export const AllProducts = () => {
    const navigate = useNavigate()
    const [filters, setFilters] = useState<FilterState>({
        brands: [],
        mayoreo: false,
        menudeo: false,
        priceRange: [0, 1000],
    })

    useEffect(() => {
        window.scrollTo(0, 0)
        syncCartCount()
    }, [])

    const filteredProducts = useMemo(
        () => filterProducts(products, filters),
        [filters]
    )

    const handleAddToCart = useCallback((product: Product) => {
        addProductToCart(product.name, product.price.toFixed(2))
    }, [])

    return (
        <>
            <section className="all-products-header-container">
                <div className="header-content">
                    <button className="btn-back" onClick={() => navigate("/")}>
                        <i className="fas fa-arrow-left" /> Volver
                    </button>
                    <div className="header-info">
                        <h1 className="page-title">Todos Nuestros Productos</h1>
                        <p className="page-subtitle">
                            Explora nuestro catálogo completo por categoría
                        </p>
                    </div>
                </div>
            </section>

            <section className="all-products-section">
                <div className="products-layout-container">
                    <FilterPanel
                        onFilterChange={(newFilters) => setFilters(newFilters)}
                    />

                    <div className="products-content-area">
                        <div className="all-products-grid" id="allProductsGrid">
                            {filteredProducts.length === 0 ? (
                                <p className="no-products-message">
                                    No hay productos que coincidan con los
                                    filtros seleccionados.
                                </p>
                            ) : (
                                filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        badge={getBadgeForProduct(product)}
                                        brand={getBrand(product)}
                                        onAddToCart={() =>
                                            handleAddToCart(product)
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
