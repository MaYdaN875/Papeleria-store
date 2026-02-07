import { useEffect, useRef, useState } from "react"
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

interface QuantityDropdownProps {
    value: number
    onChange: (v: number) => void
    max?: number
    visibleRows?: number
}

/* ================================
   COMPONENTE: QuantityDropdown
   Selector personalizado de cantidad tipo Amazon
   ================================ */
function QuantityDropdown({ value, onChange, max = 20, visibleRows = 5 }: Readonly<QuantityDropdownProps>) {
    // Estado para controlar si el dropdown está abierto o cerrado
    const [open, setOpen] = useState(false)
    // Referencia al contenedor para detectar clics fuera
    const containerRef = useRef<HTMLDivElement | null>(null)

    // Efecto para cerrar el dropdown cuando se hace clic fuera de él
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    // Crear array de números del 1 al máximo (ej: [1, 2, 3, ... 20])
    const items = Array.from({ length: max }, (_, i) => i + 1)

    return (
        // Contenedor del dropdown con referencia para detectar clics externos
        <div ref={containerRef} style={{ display: 'inline-block', minWidth: 100 }}>
            {/* Botón que muestra la cantidad seleccionada y abre/cierra el dropdown */}
            <button
                id="quantity-select-button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(prev => !prev)}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
            >
                {/* Muestra el número de cantidad actual */}
                <span style={{ fontWeight: 600 }}>{value}</span>
                {/* Ícono chevron que cambia según estado (arriba si está abierto, abajo si cerrado) */}
                <span style={{ marginLeft: 8 }}>
                    <i className={`fas fa-chevron-${open ? 'up' : 'down'}`}></i>
                </span>
            </button>

            {/* LISTA DEL DROPDOWN - Solo se muestra si open === true */}
            {open && (
                <ul
                    role="listbox"
                    aria-label="Cantidad disponible"
                    tabIndex={-1}
                    style={{
                        position: 'absolute',
                        marginTop: 8,
                        right: 0,
                        left: 0,
                        maxHeight: visibleRows * 34,
                        overflowY: 'auto',
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        padding: 0,
                        listStyle: 'none',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 80
                    }}
                >
                    {/* OPCIONES DEL DROPDOWN - Itera sobre cada número disponible */}
                    {items.map((n) => (
                        <li
                            key={n}
                            role="option"
                            aria-selected={n === value}
                            onClick={() => { onChange(n); setOpen(false) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { onChange(n); setOpen(false) } }}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                // Resalta la opción seleccionada con un fondo gris suave
                                background: n === value ? 'rgba(0,0,0,0.06)' : 'transparent'
                            }}
                        >
                            {n}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quantity, setQuantity] = useState(1)

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
                        <div style={{ marginBottom: '20px' }}>
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

                        {/* Selector de cantidad - componente personalizado (estilo Amazon) */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}
                        >
                            {/* Etiqueta para el selector de cantidad */}
                            <label
                                htmlFor="quantity-select-button"
                                style={{ fontWeight: 600, color: 'var(--color-text-dark)', fontSize: '14px', whiteSpace: 'nowrap' }}
                            >
                                Cantidad disponible:
                            </label>

                            {/* Contenedor relativo para el dropdown - permite posicionamiento absoluto del listado */}
                            <div style={{ position: 'relative' }}>
                                {/* Componente QuantityDropdown: controla cantidad de artículos a comprar */}
                                <QuantityDropdown
                                    value={quantity}
                                    onChange={(v: number) => setQuantity(v)}
                                    max={20}
                                    visibleRows={5}
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            {/* Botón Agregar al carrito */}
                            <button
                                className="btn-add-cart"
                                onClick={() => addProductToCart(product.name, product.price.toString(), quantity)}
                                style={{
                                    padding: '15px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    borderRadius: '6px'
                                }}
                            >
                                <i className="fas fa-shopping-cart"></i> Agregar
                            </button>

                            {/* Botón Comprar ahora (decorativo) */}
                            <button
                                style={{
                                    padding: '15px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'var(--transition-normal)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#475E7A'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <i className="fas fa-bolt"></i> Comprar ahora
                            </button>
                        </div>

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


        </main>
    )
}
