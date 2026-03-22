/**
 * Navbar principal: logo, buscador y acciones principales.
 * Desktop: trigger de texto "Categorías" que despliega panel al hover,
 * con subopciones por categoría en formato acordeón.
 * Mobile: mantiene menú lateral con botón de 3 líneas.
 */
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { products as staticProducts } from "../../data/products"
import { useNotification } from "../../hooks/useNotification"
import { fetchStoreCart, logoutStoreCustomer } from "../../services/customerApi"
import { signOutFirebaseSession } from "../../services/firebaseAuth"
import { fetchStoreCategories, fetchStoreProducts, type StoreCategoryNode } from "../../services/storeApi"
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

const CATEGORY_ICON_MAP: Record<string, string> = {
    "oficina-y-escolares": "fas fa-briefcase",
    "arte-y-manualidades": "fas fa-palette",
    "mitril-y-regalos": "fas fa-gift",
    "servicios-digitales-e-impresiones": "fas fa-print",
}

function slugifyLabel(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function buildNavbarCategories(nodes: StoreCategoryNode[]): NavbarCategory[] {
    return nodes.map((node) => {
        const slug = slugifyLabel(node.name)
        return {
            id: slug,
            label: node.name,
            icon: CATEGORY_ICON_MAP[slug] ?? "fas fa-folder",
            subOptions: node.children.map((child) => child.name),
        }
    })
}

const DEFAULT_NAVBAR_CATEGORIES: NavbarCategory[] = [
    {
        id: "oficina-y-escolares",
        label: "Oficina y Escolares",
        icon: "fas fa-briefcase",
        subOptions: [],
    },
    {
        id: "arte-y-manualidades",
        label: "Arte y Manualidades",
        icon: "fas fa-palette",
        subOptions: [],
    },
    {
        id: "mitril-y-regalos",
        label: "Mitril y Regalos",
        icon: "fas fa-gift",
        subOptions: [],
    },
    {
        id: "servicios-digitales-e-impresiones",
        label: "Servicios Digitales e Impresiones",
        icon: "fas fa-print",
        subOptions: [],
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
    const [categories, setCategories] = useState<NavbarCategory[]>(DEFAULT_NAVBAR_CATEGORIES)
    const [isDesktopCategoriesOpen, setIsDesktopCategoriesOpen] = useState(false)
    const [expandedDesktopCategoryId, setExpandedDesktopCategoryId] = useState<string | null>(null)
    const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null)
    const desktopCloseTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
    const preventDesktopOpenUntilRef = useRef(0)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isDesktopCategoriesOpen && menuRef.current) {
            const lists = menuRef.current.querySelectorAll(".desktop-suboptions-list")
            lists.forEach((list) => {
                list.scrollTop = 0
            })
        }
    }, [isDesktopCategoriesOpen, expandedDesktopCategoryId])

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

    const handleSubOptionClick = (categoryId: string, subOptionName: string) => {
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }

        preventDesktopOpenUntilRef.current = Date.now() + 500
        setIsDesktopCategoriesOpen(false)
        setExpandedDesktopCategoryId(null)
        navigate(`/all-products?category=${categoryId}&sub=${encodeURIComponent(subOptionName)}`)
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
            setExpandedDesktopCategoryId(null)
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
        async function loadCategories() {
            try {
                const result = await fetchStoreCategories()
                if (!result.ok || !result.categories) return
                const nextCategories = buildNavbarCategories(result.categories)
                if (nextCategories.length > 0) {
                    setCategories(nextCategories)
                }
            } catch (loadError) {
                console.error(loadError)
            }
        }

        void loadCategories()
    }, [])

    useEffect(() => {
        const refreshStoreUser = () => {
            const currentUser = getStoreUser()
            setStoreUserName(currentUser?.name ?? "")
            syncCartCount()
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
        // Primero, sincroniza desde localStorage (invitados o fallback).
        syncCartCount()

        // Si hay usuario autenticado, refrescar contador desde el servidor.
        const token = getStoreUserToken()
        if (!token) return

        void (async () => {
            try {
                const result = await fetchStoreCart(token)
                if (!result.ok || !result.items) return

                const totalItems = result.items.reduce(
                    (sum, item) => sum + (item.quantity || 1),
                    0
                )

                const cartCountElement = document.getElementById("cartCount")
                if (cartCountElement) {
                    cartCountElement.textContent = totalItems.toString()
                }
            } catch {
                // Silenciar errores de red; el contador local ya está sincronizado.
            }
        })()
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
                            <img
                                src="/logo.png"
                                alt="God Art"
                                className="header-logo-img"
                            />
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
                                ref={menuRef}
                                className="desktop-categories-menu"
                                onMouseEnter={openDesktopCategories}
                                onMouseLeave={closeDesktopCategoriesWithDelay}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        setIsDesktopCategoriesOpen(false)
                                        setExpandedDesktopCategoryId(null)
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
                                    {categories.map((category) => (
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
                                                            (subOption) => (
                                                        <button
                                                            key={`${category.id}-${subOption}`}
                                                            type="button"
                                                            className="desktop-suboption-item"
                                                            onClick={() =>
                                                                handleSubOptionClick(
                                                                    category.id,
                                                                    subOption
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
                                {categories.map((category) => (
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
                                                (subOption) => (
                                                    <button
                                                        key={`${category.id}-mobile-${subOption}`}
                                                        type="button"
                                                        className="mobile-suboption-item"
                                                        onClick={() => {
                                                            closeMenu()
                                                            handleSubOptionClick(
                                                                category.id,
                                                                subOption
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
