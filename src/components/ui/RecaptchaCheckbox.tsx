import { useEffect, useRef, useState } from "react"
import { ensureRecaptchaScript, getRecaptchaSiteKey } from "../../utils/recaptcha"

interface RecaptchaCheckboxProps {
  onVerify: (_token: string) => void
  onExpire?: () => void
}

/**
 * Widget visible "No soy un robot" de reCAPTCHA v2.
 * Devuelve el token via `onVerify` cuando el usuario completa el desafío.
 */
export default function RecaptchaCheckbox({ onVerify, onExpire }: RecaptchaCheckboxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadWidget() {
      try {
        await ensureRecaptchaScript()

        // Esperar a que grecaptcha esté listo
        await new Promise<void>((resolve) => {
          const check = () => {
            const w = window as unknown as Record<string, unknown>
            const g = w.grecaptcha as Record<string, unknown> | undefined
            if (g && typeof g.render === "function") resolve()
            else setTimeout(check, 100)
          }
          check()
        })

        if (cancelled || !containerRef.current) return

        const w = window as unknown as Record<string, unknown>
        const g = w.grecaptcha as {
          render: (_el: HTMLElement, _opts: Record<string, unknown>) => number
          reset: (_id: number) => void
        }

        if (widgetIdRef.current !== null) {
          try { g.reset(widgetIdRef.current) } catch { /* ignore */ }
        }
        containerRef.current.innerHTML = ""

        widgetIdRef.current = g.render(containerRef.current, {
          sitekey: getRecaptchaSiteKey(),
          callback: (t: string) => onVerify(t),
          "expired-callback": () => onExpire?.(),
        })
      } catch {
        if (!cancelled) setError("No se pudo cargar reCAPTCHA.")
      }
    }

    loadWidget()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{error}</p>
  }

  return <div ref={containerRef} style={{ margin: "12px 0" }} />
}
