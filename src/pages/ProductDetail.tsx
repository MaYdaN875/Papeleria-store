import { useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { addProductToCart } from "../utils/cart"

/* ================================
   COMPONENTE: ProductDetail
   Página de detalle de un producto individual
   ================================ */

interface Product {
    name: string
    brand: string
    price: number
    originalPrice?: number
    description: string
    image: string
    rating: number
    reviews: number
}

export const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    // Scroll al top cuando se carga la página
    useEffect(() => {
        // Hacer scroll al top inmediatamente
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0

        // Y también con un pequeño delay para asegurar
        const timer = setTimeout(() => {
            window.scrollTo(0, 0)
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        }, 0)

        return () => clearTimeout(timer)
    }, [id])

    // Datos de productos de ejemplo
    const products: { [key: string]: Product } = {
        '1': {
            name: 'Bolígrafos Premium',
            brand: 'Staedtler',
            price: 71.99,
            originalPrice: 89.99,
            description: 'Set de bolígrafos premium de alta calidad con tinta suave y duradera. Perfectos para escritura profesional y cotidiana.',
            image: '✒️',
            rating: 4.5,
            reviews: 234
        },
        '2': {
            name: 'Cuadernos Profesionales',
            brand: 'Moleskine',
            price: 45.5,
            description: 'Cuadernos de alta calidad con páginas de excelente gramaje. Ideales para notas, dibujo y escritura profesional.',
            image: '📓',
            rating: 5,
            reviews: 156
        },
        '3': {
            name: 'Marcadores Artísticos',
            brand: 'Copic',
            price: 102,
            originalPrice: 120,
            description: 'Marcadores artísticos de colores vibrantes y duraderos. Perfectos para diseño, ilustración y manualidades.',
            image: '🖍️',
            rating: 4.5,
            reviews: 89
        }
    }

    const product = products[id || '1']

    if (!product) {
        return (
            <main className="cart-main" style={{ textAlign: 'center' }}>
                <h2>Producto no encontrado</h2>
                <button
                    className="btn-return"
                    onClick={() => navigate('/')}
                    style={{ marginTop: '30px' }}
                >
                    Volver a la tienda
                </button>
            </main>
        )
    }

    return (
        <main className="cart-main">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <button
                    className="btn-return"
                    onClick={() => navigate('/')}
                    style={{ marginBottom: '30px' }}
                >
                    <i className="fas fa-arrow-left"></i> Volver
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    {/* Imagen del producto */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        borderRadius: '12px',
                        height: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '120px'
                    }}>
                        {product.image}
                    </div>

                    {/* Información del producto */}
                    <div>
                        <p style={{ color: 'var(--color-text-light)', marginBottom: '10px' }}>
                            Marca: <strong>{product.brand}</strong>
                        </p>
                        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '15px' }}>
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div style={{ marginBottom: '20px' }}>
                            {Array.from({ length: 5 }).map((_, i) => {
                                const isFilled = i < Math.floor(product.rating)
                                return (
                                    <i
                                        key={`star-${isFilled ? 'filled' : 'half'}-${i}`}
                                        className={`fas fa-star${isFilled ? '' : '-half-alt'}`}
                                        style={{ color: 'var(--color-warning)', marginRight: '5px' }}
                                    ></i>
                                )
                            })}
                            <span style={{ marginLeft: '10px', color: 'var(--color-text-light)' }}>
                                ({product.reviews} reseñas)
                            </span>
                        </div>

                        {/* Descripción */}
                        <p style={{
                            fontSize: '16px',
                            color: 'var(--color-text-dark)',
                            marginBottom: '30px',
                            lineHeight: '1.8'
                        }}>
                            {product.description}
                        </p>

                        {/* Precio */}
                        <div style={{ marginBottom: '30px' }}>
                            {product.originalPrice && (
                                <span style={{
                                    textDecoration: 'line-through',
                                    color: 'var(--color-text-muted)',
                                    marginRight: '15px',
                                    fontSize: '18px'
                                }}>
                                    ${product.originalPrice}
                                </span>
                            )}
                            <span style={{
                                fontSize: '36px',
                                fontWeight: 700,
                                color: 'var(--color-accent)'
                            }}>
                                ${product.price}
                            </span>
                        </div>

                        {/* Botón agregar al carrito */}
                        <button
                            className="btn-add-cart"
                            onClick={() => addProductToCart(product.name, product.price.toString())}
                            style={{
                                width: '100%',
                                padding: '15px',
                                fontSize: '18px',
                                marginBottom: '15px'
                            }}
                        >
                            <i className="fas fa-shopping-cart"></i> Agregar al carrito
                        </button>

                        {/* Información adicional */}
                        <div style={{
                            background: 'var(--color-light-bg)',
                            padding: '20px',
                            borderRadius: '8px',
                            marginTop: '20px'
                        }}>
                            <p style={{ marginBottom: '10px' }}>
                                <i className="fas fa-truck" style={{ marginRight: '10px', color: 'var(--color-primary)' }}></i>
                                <strong>Envío gratis</strong> en compras mayores a $500
                            </p>
                            <p style={{ marginBottom: '10px' }}>
                                <i className="fas fa-undo" style={{ marginRight: '10px', color: 'var(--color-primary)' }}></i>
                                <strong>Devoluciones</strong> dentro de 14 días
                            </p>
                            <p>
                                <i className="fas fa-shield-alt" style={{ marginRight: '10px', color: 'var(--color-primary)' }}></i>
                                <strong>Garantía</strong> de satisfacción 100%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ BOTÓN FLOTANTE WHATSAPP ============ */}
            <a href="https://wa.me/1234567890" className="whatsapp-btn" target="_blank" rel="noopener noreferrer" title="Contactanos por WhatsApp">
                <i className="fab fa-whatsapp"></i>
            </a>
        </main>
    )
}
