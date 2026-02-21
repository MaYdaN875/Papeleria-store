import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
    ProductDetailActions,
    ProductDetailImage,
    ProductDetailInfo,
    ProductDetailShipping,
} from "../components/product-detail"
import { getProductById } from "../data/products"
import { getStoreProducts } from "../services/productCache"
import type { Product } from "../types/Product"
import { addProductToCart } from "../utils/cart"

/**
 * Página de detalle de un producto por ID en la URL (/product/:id).
 * Muestra imagen, info, precio, selector de cantidad, envío y botón agregar al carrito.
 */

export const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quantity, setQuantity] = useState(1)
    const [product, setProduct] = useState<Product | null>(null)
    const [isLoadingProduct, setIsLoadingProduct] = useState(true)

    useEffect(() => {
        window.scrollTo(0, 0)
        setQuantity(1)

        async function loadProduct() {
            setIsLoadingProduct(true)

            const staticProduct = getProductById(id ?? "")
            try {
                const result = await getStoreProducts()
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

    if (isLoadingProduct) {
        return (
            <main className="cart-main product-detail-not-found">
                <h2>Cargando producto...</h2>
            </main>
        )
    }

    if (!product) {
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
    const originalPrice = product.originalPrice
    const rating = 4.5
    const reviews = Math.floor(product.stock * 3.5)

    const handleAddToCart = () => {
        addProductToCart(
            product.name,
            product.price.toFixed(2),
            quantity
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
                            originalPrice={originalPrice}
                            rating={rating}
                            reviews={reviews}
                        />
                        <ProductDetailActions
                            product={product}
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                            onAddToCart={handleAddToCart}
                        />
                        <ProductDetailShipping />
                    </div>
                </div>
            </div>
        </main>
    )
}
