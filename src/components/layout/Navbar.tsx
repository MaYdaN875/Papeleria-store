/**
 * Navbar principal: logo, buscador y acciones principales.
 * Desktop: trigger de texto "Categorías" que despliega panel al hover,
 * con subopciones por categoría en formato acordeón.
 * Mobile: mantiene menú lateral con botón de 3 líneas.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { products as staticProducts } from "../../data/products"
import { useNotification } from "../../hooks/useNotification"
import { logoutStoreCustomer } from "../../services/customerApi"
import { signOutFirebaseSession } from "../../services/firebaseAuth"
import { fetchStoreProducts } from "../../services/storeApi"
import type { Product } from "../../types/Product"
import { syncCartCount } from "../../utils/cart"
import {
    clearStoreSession,
    getStoreAuthChangedEventName,
    getStoreUser,
    getStoreUserProvider,
    getStoreUserToken,
} from "../../utils/storeSession"
import { Notification } from "../ui/Notification"
import { SearchBar } from "./SearchBar"

interface NavbarCategory {
    id: string
    label: string
    icon: string
    subOptions: string[]
}

const MOCK_SUB_OPTIONS = Array.from(
    { length: 15 },
    (_, index) => `Opción ${index + 1}`
)

const CATEGORIES: NavbarCategory[] = [
    {
        id: "oficina-escolares",
        label: "Oficina y Escolares",
        icon: "fas fa-briefcase",
        subOptions: MOCK_SUB_OPTIONS,
    },
    {
        id: "arte-manualidades",
        label: "Arte y Manualidades",
        icon: "fas fa-palette",
        subOptions: MOCK_SUB_OPTIONS,
    },
    {
        id: "mitril-regalos",
        label: "Mitril y Regalos",
        icon: "fas fa-gift",
        subOptions: MOCK_SUB_OPTIONS,
    },
    {
        id: "servicios-digitales-impresiones",
        label: "Servicios Digitales e Impresiones",
        icon: "fas fa-print",
        subOptions: MOCK_SUB_OPTIONS,
    },
]

function buildStoreUserLabel(fullName: string): string {
    const normalizedName = fullName.trim()
    if (!normalizedName) return "Mi cuenta"
    if (normalizedName.length <= 24) return normalizedName

    const [firstName, lastName] = normalizedName.split(/\s+/)
    if (firstName && lastName) {
        const firstAndLastName = `${firstName} ${lastName}`
        if (firstAndLastName.length <= 24) return firstAndLastName
    }

    return `${normalizedName.slice(0, 21)}...`
}

export function Navbar() {
    const { message, showNotification, clearNotification } = useNotification()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMenuClosing, setIsMenuClosing] = useState(false)
    const [searchProducts, setSearchProducts] = useState<Product[]>(staticProducts)
    const [storeUserName, setStoreUserName] = useState("")
    const [isDesktopCategoriesOpen, setIsDesktopCategoriesOpen] = useState(false)
    const [expandedDesktopCategoryId, setExpandedDesktopCategoryId] = useState<string | null>(null)
    const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null)
    const desktopCloseTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
    const preventDesktopOpenUntilRef = useRef(0)

    const handleContactClick = useCallback(() => {
        showNotification("¡Nos pondremos en contacto pronto!")
    }, [showNotification])

    const handleLogoClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            if (location.pathname === "/") {
                // Si ya estamos en la página principal, scroll hasta arriba
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                })
            } else {
                // Si no estamos en la página principal, navega al inicio
                navigate("/")
            }
        },
        [location.pathname, navigate]
    )

    const handleCategoryClick = (categoryId: string) => {
        if (isMobileMenuOpen) closeMenu()
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }
        preventDesktopOpenUntilRef.current = Date.now() + 500
        setIsDesktopCategoriesOpen(false)
        setExpandedDesktopCategoryId(null)
        navigate(`/all-products?category=${categoryId}`)
    }

    const handleSubOptionClick = (categoryId: string, subOptionIndex: number) => {
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }

        preventDesktopOpenUntilRef.current = Date.now() + 500
        setIsDesktopCategoriesOpen(false)
        setExpandedDesktopCategoryId(null)
        navigate(`/all-products?category=${categoryId}&sub=${subOptionIndex}`)
    }

    const toggleDesktopSubOptions = (categoryId: string) => {
        setExpandedDesktopCategoryId((currentId) =>
            currentId === categoryId ? null : categoryId
        )
    }

    const openDesktopCategories = () => {
        if (Date.now() < preventDesktopOpenUntilRef.current) return

        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }
        setIsDesktopCategoriesOpen(true)
    }

    const closeDesktopCategoriesWithDelay = () => {
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
        }

        desktopCloseTimeoutRef.current = globalThis.setTimeout(() => {
            setIsDesktopCategoriesOpen(false)
            desktopCloseTimeoutRef.current = null
        }, 330)
    }

    useEffect(() => {
        async function loadSearchProducts() {
            try {
                const result = await fetchStoreProducts()
                if (result.ok && result.products) {
                    setSearchProducts(result.products)
                }
            } catch (loadError) {
                console.error(loadError)
            }
        }

        void loadSearchProducts()
    }, [])

    useEffect(() => {
        const refreshStoreUser = () => {
            const currentUser = getStoreUser()
            setStoreUserName(currentUser?.name ?? "")
        }

        refreshStoreUser()
        globalThis.addEventListener("storage", refreshStoreUser)
        globalThis.addEventListener(getStoreAuthChangedEventName(), refreshStoreUser)

        return () => {
            globalThis.removeEventListener("storage", refreshStoreUser)
            globalThis.removeEventListener(getStoreAuthChangedEventName(), refreshStoreUser)
        }
    }, [])

    useEffect(() => {
        syncCartCount()
    }, [location.pathname, storeUserName])

    useEffect(() => {
        return () => {
            if (desktopCloseTimeoutRef.current !== null) {
                globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }
        preventDesktopOpenUntilRef.current = Date.now() + 250
        setIsDesktopCategoriesOpen(false)
        setExpandedDesktopCategoryId(null)
    }, [location.pathname, location.search])

    const closeMenu = () => {
        setIsMenuClosing(true)
        setTimeout(() => {
            setIsMobileMenuOpen(false)
            setIsMenuClosing(false)
            setExpandedMobileCategoryId(null)
        }, 500)
    }

    const toggleMobileSubOptions = (categoryId: string) => {
        setExpandedMobileCategoryId((currentId) =>
            currentId === categoryId ? null : categoryId
        )
    }

    const hasStoreSession = storeUserName.trim() !== ""
    const storeUserLabel = hasStoreSession ? buildStoreUserLabel(storeUserName) : "Iniciar Sesión"

    const handleStoreLogout = async () => {
        const provider = getStoreUserProvider()
        const token = getStoreUserToken()
        if (provider === "firebase") {
            await signOutFirebaseSession()
        } else if (token) {
            await logoutStoreCustomer(token)
        }
        clearStoreSession()
        showNotification("Sesión de cliente cerrada.")
        navigate("/")
    }

    return (
        <>
            {message && (
                <Notification
                    message={message}
                    onClose={clearNotification}
                    duration={3000}
                />
            )}
            <header className="header">
                <div className="header-container">
                    <div className="header-left">
                        <Link
                            to="/"
                            className="header-logo"
                            onClick={handleLogoClick}
                        >
                            <div className="logo-icon">🎨</div>
                            <h1>God Art</h1>
                        </Link>
                    </div>

                    <SearchBar
                        products={searchProducts}
                        placeholder="Buscar productos, marcas..."
                    />

                    <div className="header-right">
                        <div
                            className={`desktop-categories-wrapper ${isDesktopCategoriesOpen ? "is-open" : ""}`}
                        >
                            <button
                                type="button"
                                className="desktop-categories-trigger"
                                onClick={() =>
                                    setIsDesktopCategoriesOpen(
                                        (isOpen) => !isOpen
                                    )
                                }
                                onMouseEnter={openDesktopCategories}
                                onMouseLeave={closeDesktopCategoriesWithDelay}
                                aria-label="Mostrar categorías"
                                aria-expanded={isDesktopCategoriesOpen}
                                aria-haspopup="menu"
                            >
                                <span>Categorías</span>
                                <i
                                    className="fas fa-chevron-down"
                                    aria-hidden="true"
                                />
                            </button>
                            <div
                                className="desktop-categories-menu"
                                onMouseEnter={openDesktopCategories}
                                onMouseLeave={closeDesktopCategoriesWithDelay}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        setIsDesktopCategoriesOpen(false)
                                    }
                                }}
                                tabIndex={-1}
                                role="menu"
                                aria-label="Categorías de productos"
                            >
                                <p className="desktop-categories-title">
                                    Explorar categorías
                                </p>
                                <div className="desktop-categories-grid">
                                    {CATEGORIES.map((category) => (
                                        <div
                                            key={category.id}
                                            className={`desktop-category-group ${
                                                expandedDesktopCategoryId === category.id
                                                    ? "desktop-category-group--open"
                                                    : ""
                                            }`}
                                        >
                                            <div className="desktop-category-row">
                                                <button
                                                    type="button"
                                                    className="desktop-category-item"
                                                    onClick={() =>
                                                        handleCategoryClick(
                                                            category.id
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={category.icon}
                                                        aria-hidden="true"
                                                    />
                                                    <span>{category.label}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="desktop-category-expand-btn"
                                                    aria-label={`Desplegar opciones de ${category.label}`}
                                                    aria-expanded={
                                                        expandedDesktopCategoryId ===
                                                        category.id
                                                    }
                                                    onClick={() =>
                                                        toggleDesktopSubOptions(
                                                            category.id
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`fas fa-chevron-${
                                                            expandedDesktopCategoryId ===
                                                            category.id
                                                                ? "up"
                                                                : "down"
                                                        }`}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </div>
                                            <div className="desktop-suboptions-list">
                                                {category.subOptions.map(
                                                    (subOption, optionIndex) => (
                                                        <button
                                                            key={`${category.id}-${subOption}`}
                                                            type="button"
                                                            className="desktop-suboption-item"
                                                            onClick={() =>
                                                                handleSubOptionClick(
                                                                    category.id,
                                                                    optionIndex + 1
                                                                )
                                                            }
                                                        >
                                                            {subOption}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-categories"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Abrir menú de categorías"
                            aria-expanded={isMobileMenuOpen}
                            title="Categorías"
                        >
                            <i className="fas fa-bars" aria-hidden="true" />
                        </button>
                        <Link
                            to="/login"
                            className="btn-login"
                            aria-label={hasStoreSession ? "Ver cuenta" : "Iniciar sesión"}
                            title={hasStoreSession ? storeUserName : "Iniciar sesión"}
                        >
                            <span className="btn-login-icon">
                                <i className="fas fa-user" aria-hidden="true" />
                            </span>
                            <span className="btn-login-text">
                                {storeUserLabel}
                            </span>
                        </Link>
                        {hasStoreSession ? (
                            <button
                                type="button"
                                className="btn-cta"
                                onClick={() => void handleStoreLogout()}
                            >
                                Cerrar sesión
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-cta"
                                onClick={handleContactClick}
                            >
                                Contactar
                            </button>
                        )}
                        <Link
                            to="/cart"
                            className="cart-icon"
                            aria-label="Ver carrito"
                        >
                            <i className="fas fa-shopping-cart" aria-hidden />
                            <span className="cart-count" id="cartCount">
                                0
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Menú deslizable en móvil */}
                {isMobileMenuOpen && (
                    <>
                        <button
                            type="button"
                            className={`mobile-menu-backdrop ${isMenuClosing ? "closing" : ""}`}
                            onClick={() => closeMenu()}
                            aria-label="Cerrar menú de categorías"
                        />
                        <div className={`mobile-menu ${isMenuClosing ? "closing" : ""}`}>
                            <div className={`mobile-menu-header ${isMenuClosing ? "closing" : ""}`}>
                                <h2>Categorías</h2>
                                <button
                                    type="button"
                                    className="close-menu-btn"
                                    onClick={() => closeMenu()}
                                    aria-label="Cerrar menú"
                                >
                                    <i className="fas fa-times" aria-hidden />
                                </button>
                            </div>
                            <div className="mobile-menu-categories">
                                {CATEGORIES.map((category) => (
                                    <div
                                        key={category.id}
                                        className={`mobile-category-group ${expandedMobileCategoryId === category.id ? "mobile-category-group--open" : ""}`}
                                    >
                                        <div className={`mobile-category-row ${isMenuClosing ? "closing" : ""}`}>
                                            <button
                                                type="button"
                                                className="mobile-category-btn"
                                                onClick={() =>
                                                    handleCategoryClick(category.id)
                                                }
                                            >
                                                <i
                                                    className={category.icon}
                                                    aria-hidden
                                                />
                                                <span>{category.label}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="mobile-category-expand-btn"
                                                aria-label={`Ver opciones de ${category.label}`}
                                                aria-expanded={expandedMobileCategoryId === category.id}
                                                onClick={() => toggleMobileSubOptions(category.id)}
                                            >
                                                <i
                                                    className={`fas fa-chevron-${expandedMobileCategoryId === category.id ? "up" : "down"}`}
                                                    aria-hidden
                                                />
                                            </button>
                                        </div>
                                        <div className="mobile-suboptions-list">
                                            {category.subOptions.map(
                                                (subOption, optionIndex) => (
                                                    <button
                                                        key={`${category.id}-mobile-${subOption}`}
                                                        type="button"
                                                        className="mobile-suboption-item"
                                                        onClick={() => {
                                                            closeMenu()
                                                            handleSubOptionClick(
                                                                category.id,
                                                                optionIndex + 1
                                                            )
                                                        }}
                                                    >
                                                        {subOption}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </header>
        </>
    )
}
