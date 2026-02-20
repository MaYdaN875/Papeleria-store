import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { applyStorePasswordReset } from "../services/customerApi";
import "../styles/login.css";
import "../styles/password-recovery.css";

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token")?.trim() ?? "",
    [location.search]
  );
  const hasToken = token.length > 0;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  let submitLabel = "Guardar nueva contraseña";
  if (isSubmitting) {
    submitLabel = "Guardando...";
  } else if (cooldownSeconds > 0) {
    submitLabel = `Intenta en ${cooldownSeconds}s`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasToken) {
      setError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }

    if (cooldownSeconds > 0) {
      setError(`Demasiados intentos. Espera ${cooldownSeconds}s para reintentar.`);
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    const result = await applyStorePasswordReset({ token, password });
    if (!result.ok) {
      if ((result.retryAfterSeconds ?? 0) > 0) {
        setCooldownSeconds(Math.ceil(result.retryAfterSeconds ?? 0));
      }
      setError(result.message ?? "No se pudo actualizar la contraseña.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(result.message ?? "Contraseña actualizada correctamente.");
    setPassword("");
    setConfirmPassword("");
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

            <h1>Nueva contraseña</h1>
            <p>Define una contraseña segura para tu cuenta.</p>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-form-content">
            <div className="login-header">
              <h2>Restablecer contraseña</h2>
              <p>Ingresa y confirma tu nueva contraseña.</p>
            </div>

            {hasToken ? (
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="new-password">Nueva contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="new-password"
                      name="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                    <span className="input-icon">🔒</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-new-password">Confirmar contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="confirm-new-password"
                      name="confirm-new-password"
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                    <span className="input-icon">🔒</span>
                  </div>
                </div>

                {error && <p className="password-feedback password-feedback--error">{error}</p>}
                {successMessage && (
                  <p className="password-feedback password-feedback--success">{successMessage}</p>
                )}

                <button
                  type="submit"
                  className="login-btn"
                  disabled={isSubmitting || cooldownSeconds > 0}
                >
                  {submitLabel}
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
                  El token no está presente o el enlace está incompleto.
                </p>
                <button type="button" className="login-btn" onClick={() => navigate("/forgot-password")}>
                  Solicitar nuevo enlace
                </button>
              </div>
            )}

            <div className="signup-prompt">
              <p>
                ¿Aún sin acceso?{" "}
                <Link to="/forgot-password" className="signup-link">
                  Solicitar otro enlace
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
