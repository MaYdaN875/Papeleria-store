import { useCallback, useEffect } from "react"
import { useNavigate } from "react-router"
import { Carusel } from "../components/carousel"
import {
    //ProductCard,
    ProductCarousel,
    type ProductCarouselSlideConfig,
} from "../components/product"
import { products } from "../data/products"
import type { Product } from "../types/Product"
import { addProductToCart, syncCartCount } from "../utils/cart"

/**
 * Página principal (inicio).
 * Incluye banner carrusel, oferta especial y carruseles por categoría:
 * Destacados, Arte & Manualidades, Útiles Escolares. Sincroniza contador del carrito al montar.
 */

const FEATURED_IDS = [1, 2, 3, 4, 5, 6]

const CAROUSEL_CONFIG: Record<number, ProductCarouselSlideConfig> = {
    1: { badge: { type: "discount", value: "-20%" }, originalPrice: 89.99, brand: "Staedtler" },
    2: { badge: { type: "sale", value: "HOT" }, brand: "Moleskine" },
    3: { badge: { type: "discount", value: "-15%" }, originalPrice: 120, brand: "Copic" },
    4: { badge: { type: "discount", value: "-25%" }, originalPrice: 150, brand: "Faber-Castell" },
    5: { badge: { type: "sale", value: "NUEVO" }, brand: "Canson" },
    6: { badge: { type: "discount", value: "-10%" }, originalPrice: 55, brand: "Esselte" },
    8: { badge: { type: "discount", value: "-18%" }, originalPrice: 110, brand: "Faber-Castell" },
    9: { badge: { type: "sale", value: "NUEVO" }, brand: "Staedtler" },
    10: { badge: { type: "discount", value: "-15%" }, brand: "Staedtler" },
}

function getItemConfig(product: Product): ProductCarouselSlideConfig | undefined {
    return CAROUSEL_CONFIG[product.id]
}

export const Home = () => {
    const navigate = useNavigate()

    useEffect(() => {
        syncCartCount()
    }, [])

    const featuredProducts = products.filter((p) => FEATURED_IDS.includes(p.id))
    const artProducts = products.filter((p) => p.category === "Arte").slice(0, 5)
    const schoolProducts = products.filter((p) => p.category === "Escolar").slice(0, 5)

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
