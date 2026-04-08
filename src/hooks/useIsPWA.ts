import { useEffect, useState } from "react";

/**
 * Hook para detectar si la aplicación se está ejecutando como PWA (instalada) o en navegador.
 */
export function useIsPWA() {
    const [isPwa, setIsPwa] = useState(false);

    useEffect(() => {
        const checkIsPwa = () => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
            // Detección especial auxiliar para iOS clásico
            const isIOSStandalone = "standalone" in navigator && (navigator as any).standalone === true;
            setIsPwa(isStandalone || isIOSStandalone);
        };

        checkIsPwa();

        // Escuchar cambios dinámicos (cuando el usuario instala la PWA mientras tiene la web abierta)
        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const handleChange = (e: MediaQueryListEvent) => setIsPwa(e.matches);

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return isPwa;
}
