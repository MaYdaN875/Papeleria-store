import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import {
    ProductDetailActions,
    ProductDetailImage,
    ProductDetailInfo,
    ProductDetailShipping,
} from "../components/product-detail"
import { getProductById } from "../data/products"
import { fetchStoreProducts } from "../services/storeApi"
import type { Product } from "../types/Product"
import { addProductToCart } from "../utils/cart"

type PriceMode = "regular" | "mayoreo" | "menudeo"

/**
 * Página de detalle de un producto por ID en la URL (/product/:id).
 * Soporta ?mode=mayoreo|menudeo para mostrar precios de mayoreo/menudeo.
 * Incluye toggle estilo Amazon para cambiar entre variantes de precio.
 */

export const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [quantity, setQuantity] = useState(1)
    const [product, setProduct] = useState<Product | null>(null)
    const [isLoadingProduct, setIsLoadingProduct] = useState(true)

    // Determinar modo activo desde URL
    const urlMode = searchParams.get("mode")
    const [activeMode, setActiveMode] = useState<PriceMode>(
        urlMode === "mayoreo" || urlMode === "menudeo" ? urlMode : "regular"
    )

    // Sincronizar modo con URL
    useEffect(() => {
        if (urlMode === "mayoreo" || urlMode === "menudeo") {
            setActiveMode(urlMode)
        }
    }, [urlMode])

    useEffect(() => {
        window.scrollTo(0, 0)
        setQuantity(1)

        async function loadProduct() {
            setIsLoadingProduct(true)

            const staticProduct = getProductById(id ?? "")
            try {
                const result = await fetchStoreProducts()
                if (!result.ok || !result.products) {
                    setProduct(staticProduct ?? null)
                    setIsLoadingProduct(false)
                    return
                }

                const numericId = Number(id ?? 0)
                const apiProduct = result.products.find((item) => item.id === numericId)
                setProduct(apiProduct ?? staticProduct ?? null)
                setIsLoadingProduct(false)
            } catch (loadError) {
                console.error(loadError)
                setProduct(staticProduct ?? null)
                setIsLoadingProduct(false)
            }
        }

        void loadProduct()
    }, [id])

    // Calcular precio y stock según el modo activo
    const displayData = useMemo(() => {
        if (!product) return null

        if (activeMode === "mayoreo" && product.mayoreo && product.mayoreoPrice != null) {
            return {
                price: product.mayoreoPrice,
                stock: product.mayoreoStock ?? product.stock,
                modeLabel: "Mayoreo",
            }
        }
        if (activeMode === "menudeo" && product.menudeo && product.menudeoPrice != null) {
            return {
                price: product.menudeoPrice,
                stock: product.menudeoStock ?? product.stock,
                modeLabel: "Menudeo",
            }
        }
        return {
            price: product.price,
            stock: product.stock,
            modeLabel: null,
        }
    }, [product, activeMode])

    // ¿Tiene este producto variantes de precio?
    const hasMayoreo = product?.mayoreo && product?.mayoreoPrice != null
    const hasMenudeo = product?.menudeo && product?.menudeoPrice != null
    const hasVariants = hasMayoreo || hasMenudeo

    const handleModeChange = (mode: PriceMode) => {
        setActiveMode(mode)
        setQuantity(1)
        if (mode === "regular") {
            setSearchParams({}, { replace: true })
        } else {
            setSearchParams({ mode }, { replace: true })
        }
    }

    if (isLoadingProduct) {
        return (
            <main className="cart-main product-detail-not-found">
                <h2>Cargando producto...</h2>
            </main>
        )
    }

    if (!product || !displayData) {
        return (
            <main className="cart-main product-detail-not-found">
                <h2>Producto no encontrado</h2>
                <button
                    className="btn-return"
                    onClick={() => navigate("/")}
                >
                    Volver a la tienda
                </button>
            </main>
        )
    }

    const brand = product.description.split(" ")[0] ?? ""
    const rating = 4.5
    const reviews = Math.floor(product.stock * 3.5)

    const handleAddToCart = () => {
        const cartName = displayData.modeLabel
            ? `${product.name} (${displayData.modeLabel})`
            : product.name
        addProductToCart(
            cartName,
            displayData.price.toFixed(2),
            quantity,
            product.id
        )
    }

    return (
        <main className="cart-main">
            <div className="product-detail-page">
                <button
                    className="btn-return"
                    onClick={() => navigate("/")}
                >
                    <i className="fas fa-arrow-left" aria-hidden />
                    <span>Volver</span>
                </button>

                <div className="product-detail__layout">
                    <ProductDetailImage product={product} />

                    <div>
                        <ProductDetailInfo
                            product={product}
                            brand={brand}
                            originalPrice={activeMode === "regular" ? product.originalPrice : undefined}
                            rating={rating}
                            reviews={reviews}
                            displayPrice={displayData.price}
                            modeLabel={displayData.modeLabel}
                        />

                        {/* Toggle de variantes estilo Amazon — debajo del precio */}
                        {hasVariants && (
                            <div className="product-detail__mode-toggle">
                                <span className="product-detail__mode-label">Tipo de compra:</span>
                                <div className="product-detail__mode-options">
                                    <button
                                        type="button"
                                        className={`product-detail__mode-btn ${activeMode === "regular" ? "active" : ""}`}
                                        onClick={() => handleModeChange("regular")}
                                    >
                                        <span className="mode-btn-title">Normal</span>
                                        <span className="mode-btn-price">${product.price.toFixed(2)}</span>
                                    </button>
                                    {hasMayoreo && (
                                        <button
                                            type="button"
                                            className={`product-detail__mode-btn ${activeMode === "mayoreo" ? "active" : ""}`}
                                            onClick={() => handleModeChange("mayoreo")}
                                        >
                                            <span className="mode-btn-title">Mayoreo</span>
                                            <span className="mode-btn-price">${product.mayoreoPrice!.toFixed(2)}</span>
                                        </button>
                                    )}
                                    {hasMenudeo && (
                                        <button
                                            type="button"
                                            className={`product-detail__mode-btn ${activeMode === "menudeo" ? "active" : ""}`}
                                            onClick={() => handleModeChange("menudeo")}
                                        >
                                            <span className="mode-btn-title">Menudeo</span>
                                            <span className="mode-btn-price">${product.menudeoPrice!.toFixed(2)}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <ProductDetailActions
                            product={product}
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                            onAddToCart={handleAddToCart}
                            displayStock={displayData.stock}
                        />
                        <ProductDetailShipping />
                    </div>
                </div>
            </div>
        </main>
    )
}
