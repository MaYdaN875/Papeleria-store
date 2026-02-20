import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { verifyStoreCustomerEmail } from "../services/customerApi";
import "../styles/login.css";
import "../styles/password-recovery.css";

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token")?.trim() ?? "",
    [location.search]
  );

  const hasToken = token.length > 0;
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    globalThis.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timeoutId = globalThis.setTimeout(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [cooldownSeconds]);

  let submitLabel = "Verificar correo";
  if (isSubmitting) {
    submitLabel = "Verificando...";
  } else if (cooldownSeconds > 0) {
    submitLabel = `Intenta en ${cooldownSeconds}s`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasToken) {
      setError("El enlace no tiene un token válido.");
      return;
    }

    if (cooldownSeconds > 0) {
      setError(`Demasiados intentos. Espera ${cooldownSeconds}s para reintentar.`);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    const result = await verifyStoreCustomerEmail({ token });
    if (!result.ok) {
      if ((result.retryAfterSeconds ?? 0) > 0) {
        setCooldownSeconds(Math.ceil(result.retryAfterSeconds ?? 0));
      }
      setError(result.message ?? "No se pudo verificar el correo.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(result.message ?? "Correo verificado correctamente.");
    setIsSubmitting(false);
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-visual">
          <div className="login-visual-content">
            <button type="button" className="back-to-home-btn" onClick={() => navigate("/")}>
              <span>←</span> Volver al inicio
            </button>

            <h1>Activa tu cuenta</h1>
            <p>Verifica tu correo para poder iniciar sesión con seguridad.</p>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-form-content">
            <div className="login-header">
              <h2>Verificación de correo</h2>
              <p>Confirma tu cuenta con el enlace que recibiste.</p>
            </div>

            {hasToken ? (
              <form className="login-form" onSubmit={handleSubmit}>
                {error && <p className="password-feedback password-feedback--error">{error}</p>}
                {successMessage && (
                  <p className="password-feedback password-feedback--success">{successMessage}</p>
                )}

                <button
                  type="submit"
                  className="login-btn"
                  disabled={isSubmitting || cooldownSeconds > 0 || successMessage !== ""}
                >
                  {successMessage ? "Correo verificado" : submitLabel}
                </button>

                {successMessage && (
                  <div className="password-actions">
                    <button type="button" className="logout-secondary-btn" onClick={() => navigate("/login")}>
                      Ir a iniciar sesión
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <div className="login-form">
                <p className="password-feedback password-feedback--error">
                  El enlace no es válido o está incompleto.
                </p>
                <button type="button" className="login-btn" onClick={() => navigate("/login")}>
                  Ir a login
                </button>
              </div>
            )}

            <div className="signup-prompt">
              <p>
                ¿No te llegó el correo?{" "}
                <Link to="/login" className="signup-link">
                  Reenviar desde login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
