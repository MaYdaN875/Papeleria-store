import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { requestStorePasswordReset } from "../services/customerApi";
import "../styles/login.css";
import "../styles/password-recovery.css";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
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

  let submitLabel = "Enviar enlace";
  if (isSubmitting) {
    submitLabel = "Enviando...";
  } else if (cooldownSeconds > 0) {
    submitLabel = `Intenta en ${cooldownSeconds}s`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cooldownSeconds > 0) {
      setError(`Demasiados intentos. Espera ${cooldownSeconds}s para reintentar.`);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Ingresa un correo para continuar.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfo("");

    const result = await requestStorePasswordReset({ email: normalizedEmail });
    if (!result.ok) {
      if ((result.retryAfterSeconds ?? 0) > 0) {
        setCooldownSeconds(Math.ceil(result.retryAfterSeconds ?? 0));
      }
      setError(result.message ?? "No se pudo procesar la solicitud.");
      setIsSubmitting(false);
      return;
    }

    setInfo(result.message ?? "Revisa tu correo para recuperar tu cuenta.");
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

            <h1>Recupera tu acceso</h1>
            <p>Te enviaremos un enlace seguro para restablecer tu contraseña.</p>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-form-content">
            <div className="login-header">
              <h2>Recuperar contraseña</h2>
              <p>Escribe el correo con el que te registraste.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <span className="input-icon">✉️</span>
                </div>
              </div>

              {error && <p className="password-feedback password-feedback--error">{error}</p>}
              {info && <p className="password-feedback password-feedback--success">{info}</p>}

              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting || cooldownSeconds > 0}
              >
                {submitLabel}
              </button>
            </form>

            <div className="signup-prompt">
              <p>
                ¿Recordaste tu contraseña?{" "}
                <Link to="/login" className="signup-link">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
