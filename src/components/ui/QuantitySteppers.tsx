/**
 * QuantitySteppers.tsx
 * Componente de controles de cantidad con botones de incremento/decremento (+ y -)
 * Optimizado para uso en carrito de compras
 * Estructura similar a QuantitySelector pero con interfaz más simple y directa
 */

export interface QuantitySteppersProps {
    value: number
    onChange: (v: number) => void
    max?: number
    min?: number
    id?: string
}

/**
 * Selector de cantidad mediante botones + y -.
 * Reutilizable en el carrito, más intuitivo y minimalista que el dropdown.
 * 
 * @param value - Cantidad actual
 * @param onChange - Callback cuando la cantidad cambia
 * @param max - Cantidad máxima permitida (default: 99)
 * @param min - Cantidad mínima permitida (default: 1)
 * @param id - ID del elemento (para accessibilidad)
 */
export function QuantitySteppers({
    value,
    onChange,
    max = 99,
    min = 1,
    id = "quantity-steppers",
}: Readonly<QuantitySteppersProps>) {
    
    // Decrementar cantidad
    const handleDecrement = () => {
        if (value > min) {
            onChange(value - 1)
        }
    }

    // Incrementar cantidad
    const handleIncrement = () => {
        if (value < max) {
            onChange(value + 1)
        }
    }

    // Manejo de entrada manual
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value, 10)
        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            onChange(newValue)
        }
    }

    return (
        <div className="quantity-steppers" id={id}>
            {/* Botón decrementar */}
            <button
                type="button"
                className="quantity-steppers__btn quantity-steppers__btn--minus"
                onClick={handleDecrement}
                disabled={value <= min}
                aria-label="Disminuir cantidad"
                title="Disminuir"
            >
                <i className="fas fa-minus" />
            </button>

            {/* Display de cantidad (input) */}
            <input
                type="number"
                className="quantity-steppers__input"
                value={value}
                onChange={handleInputChange}
                min={min}
                max={max}
                aria-label="Cantidad"
                readOnly
            />

            {/* Botón incrementar */}
            <button
                type="button"
                className="quantity-steppers__btn quantity-steppers__btn--plus"
                onClick={handleIncrement}
                disabled={value >= max}
                aria-label="Aumentar cantidad"
                title="Aumentar"
            >
                <i className="fas fa-plus" />
            </button>
        </div>
    )
}
