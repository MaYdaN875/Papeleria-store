import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import "../../styles/category-dropdown.css"

export type CategoryItem = {
    name: string
    icon: string
    color: string
}

export type CategoryDropdownCategory = {
    id: string
    label: string
    icon: string
    items: CategoryItem[]
}

interface CategoryDropdownProps {
    category: CategoryDropdownCategory
}

export function CategoryDropdown({ category }: CategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
        setIsOpen(true)
    }

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 150)
    }

    const handleItemClick = (_itemName: string) => {
        navigate(`/all-products?category=${category.id}`)
        setIsOpen(false)
    }

    return (
        <div
            className="category-dropdown-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                className={`category-link ${isOpen ? "active" : ""}`}
            >
                <i className={category.icon} aria-hidden /> {category.label}
                <i className="fas fa-chevron-down dropdown-arrow" aria-hidden />
            </button>

            {isOpen && (
                <div className="category-dropdown-menu">
                    <div className="dropdown-grid">
                        {category.items.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                className="dropdown-item"
                                onClick={() => handleItemClick(item.name)}
                            >
                                <div
                                    className="item-icon"
                                    style={{ backgroundColor: item.color }}
                                >
                                    <i className={item.icon} aria-hidden />
                                </div>
                                <span className="item-label">{item.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
