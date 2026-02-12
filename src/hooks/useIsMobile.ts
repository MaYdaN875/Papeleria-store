import { useEffect, useState } from "react"

interface UseIsMobileOptions {
    /** Ancho máximo en píxeles para considerar dispositivo como móvil (por defecto 768px) */
    breakpoint?: number
}

/**
 * Hook personalizado para detectar si el dispositivo es móvil
 * Se actualiza cuando cambia el tamaño de la ventana
 *
 * @param options - Opciones de configuración
 * @returns true si el dispositivo es móvil, false en caso contrario
 */
export function useIsMobile({
    breakpoint = 768,
}: UseIsMobileOptions = {}): boolean {
    // Estado para almacenar si es móvil
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        /**
         * Verifica si el ancho de la ventana es menor que el breakpoint
         */
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= breakpoint)
        }

        // Verificar al montar el componente
        checkIsMobile()

        // Agregar listener para cambios de tamaño
        window.addEventListener("resize", checkIsMobile)

        // Limpiar listener al desmontar
        return () => {
            window.removeEventListener("resize", checkIsMobile)
        }
    }, [breakpoint])

    return isMobile
}
