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

function buildHomeCarouselProducts(
    products: Product[],
    slot: 1 | 2 | 3,
    fallbackMatcher?: (product: Product) => boolean
): Product[] {
    const selectedProducts: Product[] = []
    const usedProductIds = new Set<number>()

    const slotProducts = products.filter((product) => Number(product.homeCarouselSlot ?? 0) === slot)
    for (const product of slotProducts) {
        if (usedProductIds.has(product.id)) continue
        selectedProducts.push(product)
        usedProductIds.add(product.id)
        if (selectedProducts.length >= PRODUCTS_PER_HOME_CAROUSEL) break
    }

    if (selectedProducts.length < PRODUCTS_PER_HOME_CAROUSEL && fallbackMatcher) {
        const fallbackProducts = products.filter(fallbackMatcher)
        for (const product of fallbackProducts) {
            if (usedProductIds.has(product.id)) continue
            selectedProducts.push(product)
            usedProductIds.add(product.id)
            if (selectedProducts.length >= PRODUCTS_PER_HOME_CAROUSEL) break
        }
    }

    if (selectedProducts.length < PRODUCTS_PER_HOME_CAROUSEL) {
        for (const product of products) {
            if (usedProductIds.has(product.id)) continue
            selectedProducts.push(product)
            usedProductIds.add(product.id)
            if (selectedProducts.length >= PRODUCTS_PER_HOME_CAROUSEL) break
        }
    }

    return selectedProducts
}

export const Home = () => {
    const navigate = useNavigate()
    const [storeProducts, setStoreProducts] = useState<Product[] | null>(null)
    const [bannerSlides, setBannerSlides] = useState<CarouselBannerSlide[]>([])

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

        async function loadHomeSlides() {
            try {
                const result = await fetchStoreHomeSlides()
                if (!result.ok || !result.slides || result.slides.length === 0) {
                    setBannerSlides([])
                    return
                }

                setBannerSlides(
                    result.slides.map((slide) => ({
                        id: slide.id,
                        title: `Slide ${slide.displayOrder}`,
                        image: slide.imageUrl,
                        fullImage: true,
                        redirectPath: "/all-products",
                    }))
                )
            } catch (loadSlidesError) {
                console.error(loadSlidesError)
                setBannerSlides([])
            }
        }

        void loadStoreProducts()
        void loadHomeSlides()
    }, [])

    const baseProducts = storeProducts ?? staticProducts

    const featuredProducts = useMemo(
        () => buildHomeCarouselProducts(baseProducts, 1),
        [baseProducts]
    )
    const artProducts = useMemo(() => {
        return buildHomeCarouselProducts(baseProducts, 2, (product) =>
            /arte|manualidades/i.test(product.category)
        )
    }, [baseProducts])
    const schoolProducts = useMemo(() => {
        return buildHomeCarouselProducts(baseProducts, 3, (product) =>
            /escolar|oficina/i.test(product.category)
        )
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
                <Carusel type="banner" bannerSlides={bannerSlides} />
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
