export function ProductDetailShipping() {
    return (
        <div className="product-detail__shipping">
            <p>
                <i className="fas fa-truck product-detail__shipping-icon" aria-hidden />
                <strong>Envío gratis</strong> en compras mayores a $500
            </p>
            <p>
                <i className="fas fa-undo product-detail__shipping-icon" aria-hidden />
                <strong>Devoluciones</strong> dentro de 14 días
            </p>
            <p>
                <i className="fas fa-shield-alt product-detail__shipping-icon" aria-hidden />
                <strong>Garantía</strong> de satisfacción 100%
            </p>
        </div>
    )
}
