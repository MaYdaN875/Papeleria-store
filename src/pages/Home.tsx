import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Carusel } from "../components/carousel"
import {
    ProductCarousel,
    type ProductCarouselSlideConfig,
} from "../components/product"
import { products as staticProducts } from "../data/products"
import { fetchStoreProducts } from "../services/storeApi"
import type { Product } from "../types/Product"
import { addProductToCart, syncCartCount } from "../utils/cart"

/**
 * Página principal (inicio).
 * Incluye banner carrusel, oferta especial y carruseles por categoría:
 * Destacados, Arte & Manualidades, Útiles Escolares. Sincroniza contador del carrito al montar.
 */

function getItemConfig(product: Product): ProductCarouselSlideConfig | undefined {
    const brand = product.description.split(" ")[0] ?? ""

    if (!product.originalPrice || product.originalPrice <= product.price) {
        return {
            brand,
        }
    }

    const discountPercent = product.discountPercentage ??
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

    return {
        brand,
        originalPrice: product.originalPrice,
        badge: discountPercent > 0
            ? { type: "discount", value: `-${discountPercent}%` }
            : undefined,
    }
}

export const Home = () => {
    const navigate = useNavigate()
    const [storeProducts, setStoreProducts] = useState<Product[] | null>(null)

    useEffect(() => {
        syncCartCount()

        async function loadStoreProducts() {
            try {
                const result = await fetchStoreProducts()
                if (result.ok && result.products) {
                    setStoreProducts(result.products)
                } else {
                    setStoreProducts(null)
                }
            } catch (loadError) {
                console.error(loadError)
                setStoreProducts(null)
            }
        }

        void loadStoreProducts()
    }, [])

    const baseProducts = storeProducts ?? staticProducts

    const featuredProducts = useMemo(
        () => baseProducts.slice(0, 6),
        [baseProducts]
    )
    const artProducts = useMemo(() => {
        const matches = baseProducts.filter((p) =>
            /arte|manualidades/i.test(p.category)
        )
        return (matches.length > 0 ? matches : baseProducts).slice(0, 5)
    }, [baseProducts])
    const schoolProducts = useMemo(() => {
        const matches = baseProducts.filter((p) =>
            /escolar|oficina/i.test(p.category)
        )
        return (matches.length > 0 ? matches : baseProducts).slice(0, 5)
    }, [baseProducts])

    const handleAddToCart = useCallback((name: string, price: string) => {
        addProductToCart(name, price)
    }, [])

    const handleNavigate = useCallback(
        (id: number) => navigate(`/product/${id}`),
        [navigate]
    )

    return (
        <>
            <section id="inicio" className="banner-principal">
                <Carusel type="banner" />
            </section>

            <section className="products-section">
                <ProductCarousel
                    title="⭐ Productos Destacados"
                    products={featuredProducts}
                    getItemConfig={getItemConfig}
                    onNavigate={handleNavigate}
                    onAddToCart={handleAddToCart}
                    seeMorePath="/all-products"
                />
                <ProductCarousel
                    title="🎨 Arte & Manualidades"
                    products={artProducts}
                    getItemConfig={getItemConfig}
                    onNavigate={handleNavigate}
                    onAddToCart={handleAddToCart}
                    seeMorePath="/all-products"
                />
                <ProductCarousel
                    title="📚 Útiles Escolares"
                    products={schoolProducts}
                    getItemConfig={getItemConfig}
                    onNavigate={handleNavigate}
                    onAddToCart={handleAddToCart}
                    seeMorePath="/all-products"
                />
            </section>

        </>
    )
}
