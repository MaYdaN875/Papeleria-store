/**
 * Componente PWA de instalación.
 * - En Android/Chrome/Windows: captura el evento `beforeinstallprompt` y muestra un banner.
 * - En iOS (Safari/Chrome): muestra instrucciones manuales para "Agregar a inicio".
 * - Si la app ya está instalada, no muestra nada.
 */
import { useCallback, useEffect, useState } from "react"
import "./InstallPWA.css"

/** Detecta si el navegador es iOS (iPhone/iPad). */
function isIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** Detecta si estamos en modo standalone (ya instalada). */
function isStandalone(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true)
    )
}

/** Detecta si es Safari REAL en iOS (no Chrome, Google App, Facebook, Instagram, etc). */
function isIOSSafari(): boolean {
    const ua = navigator.userAgent
    // Excluir: CriOS=Chrome, FxiOS=Firefox, OPiOS=Opera, EdgiOS=Edge, GSA=Google App,
    // FBAN/FBAV=Facebook, Instagram, Line, etc.
    return isIOS() && /safari/i.test(ua) && !/crios|fxios|opios|edgios|gsa\/|fban|fbav|instagram|line\//i.test(ua)
}

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showIOSGuide, setShowIOSGuide] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    // Revisar si el usuario ya descartó el banner anteriormente
    useEffect(() => {
        const wasDismissed = localStorage.getItem("pwa-install-dismissed")
        if (wasDismissed) {
            setDismissed(true)
        }
    }, [])

    // Capturar el evento beforeinstallprompt (Android/Chrome/Windows)
    useEffect(() => {
        if (isStandalone()) return

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    // Detectar iOS para mostrar guía manual
    useEffect(() => {
        if (isStandalone()) return
        if (isIOS() && !dismissed) {
            setShowIOSGuide(true)
        }
    }, [dismissed])

    const handleInstallClick = useCallback(async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === "accepted") {
            setDeferredPrompt(null)
        }
    }, [deferredPrompt])

    const handleDismiss = useCallback(() => {
        setDismissed(true)
        setDeferredPrompt(null)
        setShowIOSGuide(false)
        localStorage.setItem("pwa-install-dismissed", "true")
    }, [])

    // Si la app ya está instalada o el usuario descartó, no mostrar nada
    if (isStandalone() || dismissed) return null

    // Banner para Android/Chrome/Windows (beforeinstallprompt disponible)
    if (deferredPrompt) {
        return (
            <div className="install-pwa-banner">
                <div className="install-pwa-content">
                    <i className="fas fa-mobile-alt install-pwa-icon" aria-hidden="true" />
                    <div className="install-pwa-text">
                        <strong>¡Instala God Art!</strong>
                        <span>Agrégala a tu pantalla de inicio para un acceso rápido.</span>
                    </div>
                </div>
                <div className="install-pwa-actions">
                    <button
                        className="install-pwa-btn install-pwa-btn--install"
                        onClick={() => void handleInstallClick()}
                    >
                        <i className="fas fa-download" aria-hidden="true" />
                        Instalar
                    </button>
                    <button
                        className="install-pwa-btn install-pwa-btn--dismiss"
                        onClick={handleDismiss}
                        aria-label="Cerrar"
                    >
                        <i className="fas fa-times" aria-hidden="true" />
                    </button>
                </div>
            </div>
        )
    }

    // Guía para iOS
    if (showIOSGuide) {
        const isSafari = isIOSSafari()

        return (
            <div className="install-pwa-banner install-pwa-banner--ios">
                <div className="install-pwa-content">
                    <i className="fas fa-mobile-alt install-pwa-icon" aria-hidden="true" />
                    <div className="install-pwa-text">
                        <strong>¡Instala God Art!</strong>
                        {isSafari ? (
                            <span>
                                Pulsa{" "}
                                <i className="fas fa-ellipsis-h" aria-hidden="true" />{" "}
                                →{" "}
                                <i className="fas fa-share-square" aria-hidden="true" />{" "}
                                <strong>Compartir</strong> →{" "}
                                <strong>&ldquo;Agregar al inicio&rdquo;</strong>.
                                ¡Y listo! 🎉
                            </span>
                        ) : (
                            <span>
                                Pulsa{" "}
                                <i className="fas fa-share-square" aria-hidden="true" />{" "}
                                <strong>Compartir</strong> →{" "}
                                <strong>&ldquo;Abrir en Safari&rdquo;</strong>{" "}
                                para continuar con la instalación.
                            </span>
                        )}
                    </div>
                </div>
                <div className="install-pwa-actions">
                    <button
                        className="install-pwa-btn install-pwa-btn--dismiss"
                        onClick={handleDismiss}
                        aria-label="Cerrar"
                    >
                        <i className="fas fa-times" aria-hidden="true" />
                    </button>
                </div>
            </div>
        )
    }

    return null
}
