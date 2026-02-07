import { useState } from "react"

export type CategoryFilter = {
    id: string
    label: string
    icon: string
}

const DEFAULT_CATEGORIES: CategoryFilter[] = [
    { id: "todos", label: "Todos", icon: "fas fa-th" },
    { id: "escolares", label: "Útiles Escolares", icon: "fas fa-book" },
    { id: "escritura", label: "Escritura", icon: "fas fa-pencil-alt" },
    { id: "papeleria", label: "Papelería", icon: "fas fa-file" },
    { id: "arte", label: "Arte & Manualidades", icon: "fas fa-palette" },
]

export interface CategoryFiltersProps {
    categories?: CategoryFilter[]
    onFilter: (categoryId: string) => void
}

export function CategoryFilters({
    categories = DEFAULT_CATEGORIES,
    onFilter,
}: CategoryFiltersProps) {
    const [activeId, setActiveId] = useState("todos")

    const handleClick = (id: string) => {
        setActiveId(id)
        onFilter(id)
    }

    return (
        <div className="category-filters">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    type="button"
                    className={`filter-btn ${activeId === cat.id ? "active" : ""}`}
                    onClick={() => handleClick(cat.id)}
                >
                    <i className={cat.icon} aria-hidden /> {cat.label}
                </button>
            ))}
        </div>
    )
}
