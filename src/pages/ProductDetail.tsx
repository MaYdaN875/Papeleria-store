import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import {
    ProductDetailActions,
    ProductDetailImage,
    ProductDetailInfo,
} from "../components/product-detail"
import { getProductById } from "../data/products"
import { fetchStoreProducts } from "../services/storeApi"
import type { Product } from "../types/Product"
import { addProductToCart } from "../utils/cart"

/**
 * Página de detalle de un producto por ID en la URL (/product/:id).
 * El precio de mayoreo se aplica automáticamente según la cantidad comprada
 * y el mayoreoMinQty configurado para cada producto.
 */

export const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [quantity, setQuantity] = useState(1)
    const [product, setProduct] = useState<Product | null>(null)
    const [isLoadingProduct, setIsLoadingProduct] = useState(true)

    // Leer página de la URL y destino de retorno
    const pageNumber = searchParams.get("page") || "1"
    const returnTo = searchParams.get("returnTo") || null
    const backButtonLabel = returnTo === "/cart" ? "Volver al carrito" : "Volver"

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

    // Calcular precio y datos de stock según cantidad (siempre mostramos rangos menudeo/mayoreo)
    const displayData = useMemo(() => {
        if (!product) return null

        const mayoreoMinQty = product.mayoreoMinQty ?? 10
        const menudeoStock = Math.max(0, product.menudeoStock ?? product.stock ?? 0)
        const mayoreoStock = Math.max(0, product.mayoreoStock ?? 0)
        const hasMayoreo = Boolean(product.mayoreo && product.mayoreoPrice != null)

        // Stock total = menudeo + mayoreo; si no hay rangos configurados, usar product.stock
        const totalStock =
            hasMayoreo && (menudeoStock > 0 || mayoreoStock > 0)
                ? menudeoStock + mayoreoStock
                : Math.max(product.stock, menudeoStock, 1)
        const appliesMayoreo = hasMayoreo && quantity >= mayoreoMinQty

        return {
            price: appliesMayoreo && product.mayoreoPrice != null ? product.mayoreoPrice : product.price,
            isApplyingMayoreo: appliesMayoreo,
            mayoreoMinQty,
            menudeoStock,
            mayoreoStock,
            totalStock,
            mayoreoMaxQty: hasMayoreo ? mayoreoMinQty + mayoreoStock - 1 : 0,
        }
    }, [product, quantity])

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
                    onClick={() => navigate(`/all-products?page=${pageNumber}`)}
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
        if (!product || !displayData) return
        const mayoreo =
            product.mayoreo && product.mayoreoPrice != null && displayData.mayoreoMinQty != null
                ? {
                      basePrice: product.price.toFixed(2),
                      mayoreoPrice: product.mayoreoPrice.toFixed(2),
                      mayoreoMinQty: displayData.mayoreoMinQty,
                  }
                : undefined
        addProductToCart(
            product.name,
            displayData.price.toFixed(2),
            quantity,
            product.id,
            product.image,
            mayoreo
        )
    }

    return (
        <main className="cart-main">
            <div className="product-detail-page">
                <button
                    className="btn-return"
                    onClick={() => {
                        if (returnTo) {
                            navigate(returnTo)
                        } else {
                            navigate(`/all-products?page=${pageNumber}`)
                        }
                    }}
                >
                    <i className="fas fa-arrow-left" aria-hidden />
                    <span>{backButtonLabel}</span>
                </button>

                <div className="product-detail__layout">
                    <ProductDetailImage product={product} />

                    <div>
                        <ProductDetailInfo
                            product={product}
                            brand={brand}
                            originalPrice={!displayData.isApplyingMayoreo ? product.originalPrice : undefined}
                            rating={rating}
                            reviews={reviews}
                            displayPrice={displayData.price ?? product.price}
                            modeLabel={displayData.isApplyingMayoreo ? "Precio mayoreo aplicado" : undefined}
                        />

                        {/* Mostrar mensaje de descuento por mayoreo */}
                        {product?.mayoreo && product?.mayoreoPrice != null && (
                            <div className="product-detail__mayoreo-info">
                                {displayData.isApplyingMayoreo ? (
                                    <p style={{ color: "#27ae60", marginTop: "10px", fontWeight: "bold" }}>
                                        ✓ Descuento por mayoreo aplicado (desde {displayData.mayoreoMinQty} unidades)
                                    </p>
                                ) : (
                                    <p style={{ color: "#7f8c8d", marginTop: "10px" }}>
                                        Compra {displayData.mayoreoMinQty} o más unidades y recibe precio de mayoreo: ${product.mayoreoPrice.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}

                        <ProductDetailActions
                            product={product}
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                            onAddToCart={handleAddToCart}
                            stockRanges={{
                                menudeoStock: displayData.menudeoStock,
                                mayoreoMinQty: displayData.mayoreoMinQty,
                                mayoreoStock: displayData.mayoreoStock,
                                mayoreoMaxQty: displayData.mayoreoMaxQty,
                                totalStock: displayData.totalStock,
                                hasMayoreo: Boolean(product.mayoreo && product.mayoreoPrice != null),
                            }}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
