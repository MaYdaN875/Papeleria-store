import { useEffect, useRef, useState } from "react"

export interface QuantitySelectorProps {
    value: number
    onChange: (v: number) => void
    max?: number
    visibleRows?: number
    id?: string
}

/**
 * Selector de cantidad tipo dropdown (estilo Amazon).
 * Reutilizable en ProductDetail, Cart, etc.
 */
export function QuantitySelector({
    value,
    onChange,
    max = 20,
    visibleRows = 5,
    id = "quantity-select-button",
}: Readonly<QuantitySelectorProps>) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("click", handleClickOutside)
        return () => document.removeEventListener("click", handleClickOutside)
    }, [])

    const items = Array.from({ length: max }, (_, i) => i + 1)

    return (
        <div ref={containerRef} className="quantity-selector">
            <button
                id={id}
                type="button"
                className="quantity-selector__trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="quantity-selector__value">{value}</span>
                <i
                    className={`fas fa-chevron-${open ? "up" : "down"}`}
                    aria-hidden
                />
            </button>
            {open && (
                <ul
                    role="listbox"
                    aria-label="Cantidad disponible"
                    tabIndex={-1}
                    className="quantity-selector__list"
                    style={{ maxHeight: visibleRows * 34 }}
                >
                    {items.map((n) => (
                        <li
                            key={n}
                            role="option"
                            aria-selected={n === value}
                            className={`quantity-selector__option ${
                                n === value ? "quantity-selector__option--selected" : ""
                            }`}
                            onClick={() => {
                                onChange(n)
                                setOpen(false)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    onChange(n)
                                    setOpen(false)
                                }
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
