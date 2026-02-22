/**
 * Utilidades para reCAPTCHA v2 (checkbox visible "No soy un robot").
 *
 * Carga el script de Google reCAPTCHA v2 de forma lazy y proporciona
 * funciones para renderizar el widget y obtener el token.
 */

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined

/** Devuelve la site key configurada. */
export function getRecaptchaSiteKey(): string {
  return SITE_KEY?.trim() ?? ""
}

/** Carga el script de reCAPTCHA v2 una sola vez en el DOM. */
export function ensureRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!SITE_KEY) {
      reject(new Error("VITE_RECAPTCHA_SITE_KEY no está configurada."))
      return
    }

    if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://www.google.com/recaptcha/api.js"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar reCAPTCHA."))
    document.head.appendChild(script)
  })
}
