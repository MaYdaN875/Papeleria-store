import { useNavigate } from "react-router"

export interface PageHeaderProps {
    /** Ruta a la que navega el botón "Volver" */
    backTo: string
    title: string
    subtitle?: string
}

export function PageHeader({ backTo, title, subtitle }: PageHeaderProps) {
    const navigate = useNavigate()

    return (
        <section className="all-products-header-container">
            <div className="header-content">
                <button type="button" className="btn-back" onClick={() => navigate(backTo)}>
                    <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
                </button>
                <div className="header-info">
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
            </div>
        </section>
    )
}
