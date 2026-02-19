import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Carusel, type CarouselBannerSlide } from "../components/carousel"
import {
    ProductCarousel,
    type ProductCarouselSlideConfig,
} from "../components/product"
import { products as staticProducts } from "../data/products"
import { fetchStoreHomeSlides, fetchStoreProducts } from "../services/storeApi"
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

const PRODUCTS_PER_HOME_CAROUSEL = 6
const HOME_SKELETON_SECTION_IDS = ["featured", "art", "school"] as const
const HOME_SKELETON_CARD_IDS = ["card-1", "card-2", "card-3"] as const

function appendUniqueProducts(
    sourceProducts: Product[],
    selectedProducts: Product[],
    usedProductIds: Set<number>
): void {
    for (const product of sourceProducts) {
        if (selectedProducts.length >= PRODUCTS_PER_HOME_CAROUSEL) break
        if (usedProductIds.has(product.id)) continue
        selectedProducts.push(product)
        usedProductIds.add(product.id)
    }
}

function buildHomeCarouselProducts(
    products: Product[],
    slot: 1 | 2 | 3
): Product[] {
    const selectedProducts: Product[] = []
    const usedProductIds = new Set<number>()

    const slotProducts = products.filter((product) => Number(product.homeCarouselSlot ?? 0) === slot)
    appendUniqueProducts(slotProducts, selectedProducts, usedProductIds)

    return selectedProducts
}

export const Home = () => {
    const navigate = useNavigate()
    const [storeProducts, setStoreProducts] = useState<Product[]>([])
    const [shouldUseStaticFallback, setShouldUseStaticFallback] = useState(false)
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [bannerSlides, setBannerSlides] = useState<CarouselBannerSlide[]>([])

    useEffect(() => {
        syncCartCount()

        async function loadStoreProducts() {
            setIsLoadingProducts(true)
            try {
                const result = await fetchStoreProducts()
                if (result.ok && result.products) {
                    setStoreProducts(result.products)
                    setShouldUseStaticFallback(false)
                } else {
                    setStoreProducts([])
                    setShouldUseStaticFallback(true)
                }
            } catch (loadError) {
                console.error(loadError)
                setStoreProducts([])
                setShouldUseStaticFallback(true)
            } finally {
                setIsLoadingProducts(false)
            }
        }

        async function loadHomeSlides() {
            try {
                const result = await fetchStoreHomeSlides()
                if (!result.ok || !result.slides || result.slides.length === 0) {
                    setBannerSlides([])
                } else {
                    setBannerSlides(
                        result.slides.map((slide) => ({
                            id: slide.id,
                            title: `Slide ${slide.displayOrder}`,
                            image: slide.imageUrl,
                            fullImage: true,
                            redirectPath: "/all-products",
                        }))
                    )
                }
            } catch (loadSlidesError) {
                console.error(loadSlidesError)
                setBannerSlides([])
            }
        }

        void loadStoreProducts()
        void loadHomeSlides()
    }, [])

    const baseProducts = shouldUseStaticFallback ? staticProducts : storeProducts
    const featuredProducts = useMemo(
        () => buildHomeCarouselProducts(baseProducts, 1),
        [baseProducts]
    )
    const artProducts = useMemo(() => {
        return buildHomeCarouselProducts(baseProducts, 2)
    }, [baseProducts])
    const schoolProducts = useMemo(() => {
        return buildHomeCarouselProducts(baseProducts, 3)
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
                <Carusel
                    type="banner"
                    bannerSlides={bannerSlides}
                    showDefaultBannerFallback={false}
                />
            </section>

            <section className="products-section">
                {isLoadingProducts ? (
                    <div className="home-products-skeleton">
                        {HOME_SKELETON_SECTION_IDS.map((sectionId) => (
                            <article
                                key={`home-products-skeleton-section-${sectionId}`}
                                className="home-products-skeleton-section"
                            >
                                <div className="home-products-skeleton-title home-skeleton-shimmer" />
                                <div className="home-products-skeleton-row">
                                    {HOME_SKELETON_CARD_IDS.map((cardId) => (
                                        <div
                                            key={`home-products-skeleton-card-${sectionId}-${cardId}`}
                                            className="home-products-skeleton-card"
                                        >
                                            <div className="home-products-skeleton-image home-skeleton-shimmer" />
                                            <div className="home-products-skeleton-line home-skeleton-shimmer" />
                                            <div className="home-products-skeleton-line home-products-skeleton-line--short home-skeleton-shimmer" />
                                            <div className="home-products-skeleton-button home-skeleton-shimmer" />
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </section>

        </>
    )
}
