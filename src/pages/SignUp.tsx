import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import RecaptchaCheckbox from "../components/ui/RecaptchaCheckbox";
import { registerStoreCustomer } from "../services/customerApi";
import "../styles/password-recovery.css";
import "../styles/signup.css";
import { migrateGuestCartToUser } from "../utils/cart";
import { setStoreSession } from "../utils/storeSession";

export function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerCooldownSeconds, setRegisterCooldownSeconds] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");

  const passwordMatch = useMemo(() => {
    if (!confirmPassword) return true;
    return password === confirmPassword;
  }, [confirmPassword, password]);
  let signUpButtonLabel = "Crear Cuenta";
  if (isSubmitting) {
    signUpButtonLabel = "Creando cuenta...";
  } else if (registerCooldownSeconds > 0) {
    signUpButtonLabel = `Intenta en ${registerCooldownSeconds}s`;
  }

  useEffect(() => {
    if (registerCooldownSeconds <= 0) return;

    const timeoutId = globalThis.setTimeout(() => {
      setRegisterCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [registerCooldownSeconds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registerCooldownSeconds > 0) {
      setError(`Demasiados intentos. Espera ${registerCooldownSeconds}s para reintentar.`);
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName || !email.trim() || !password.trim()) {
      setError("Nombre, correo y contraseña son obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (!passwordMatch) {
      setError("Las contraseñas no coinciden.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setIsSubmitting(false);
      return;
    }

    if (!agreeTerms) {
      setError("Debes aceptar términos y condiciones.");
      setIsSubmitting(false);
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación \"No soy un robot\".");
      setIsSubmitting(false);
      return;
    }

    let result: Awaited<ReturnType<typeof registerStoreCustomer>>;
    try {
      result = await registerStoreCustomer({
        name: fullName,
        email: email.trim().toLowerCase(),
        password,
        recaptchaToken: captchaToken,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la cuenta.");
      setIsSubmitting(false);
      return;
    }

    if (!result.ok) {
      if ((result.retryAfterSeconds ?? 0) > 0) {
        setRegisterCooldownSeconds(Math.ceil(result.retryAfterSeconds ?? 0));
      }
      if (result.requiresEmailVerification) {
        setError("");
        setSuccessMessage(
          result.message ?? "Ese correo ya existe y requiere verificación. Reenviamos el enlace."
        );
        setIsSubmitting(false);
        return;
      }
      setError(result.message ?? "No se pudo crear la cuenta.");
      setIsSubmitting(false);
      return;
    }

    if (result.token && result.user) {
      setStoreSession(result.token, result.user);
      migrateGuestCartToUser();
      navigate("/", { replace: true });
      return;
    }

    setSuccessMessage(
      result.message ?? "Cuenta creada. Revisa tu correo y verifica tu cuenta para iniciar sesión."
    );
    setPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-visual">
          <div className="signup-visual-content">
            <button type="button" className="back-to-home-btn" onClick={() => navigate("/")}>
              <span>←</span> Volver al inicio
            </button>

            <h1>Únete a nuestra comunidad</h1>
            <p>Crea tu cuenta y disfruta de beneficios exclusivos</p>

            <div className="signup-visual-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🎁</span>
                <p>Descuentos y ofertas</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🚚</span>
                <p>Envíos rápidos</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">💳</span>
                <p>Pagos seguros</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📞</span>
                <p>Soporte 24/7</p>
              </div>
            </div>

            <div className="signup-visual-decoration">
              <div className="shape shape-1" />
              <div className="shape shape-2" />
              <div className="shape shape-3" />
              <div className="shape shape-4" />
            </div>
          </div>
        </div>

        <div className="signup-form-section">
          <div className="signup-form-content">
            <div className="signup-header">
              <h2>Crear Cuenta</h2>
              <p>Completa el formulario para registrarte</p>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nombre</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Tu nombre"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                    />
                    <span className="input-icon">👤</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Apellido</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Tu apellido"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                    />
                    <span className="input-icon">👤</span>
                  </div>
                </div>
              </div>

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

              <div className="form-group">
                <label htmlFor="phone">Teléfono (opcional)</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+52 55 0000 0000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                  <span className="input-icon">📱</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="password"
                      name="password"
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
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={8}
                      required
                      className={passwordMatch ? "" : "error"}
                    />
                    <span className="input-icon">🔒</span>
                  </div>
                  {!passwordMatch && <span className="error-text">Las contraseñas no coinciden</span>}
                </div>
              </div>

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  required
                />
                <span>
                  Acepto los{" "}
                  <button type="button" className="terms-link">términos y condiciones</button>
                  {" "}y la{" "}
                  <button type="button" className="terms-link">política de privacidad</button>
                </span>
              </label>

              <RecaptchaCheckbox
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
              />

              {error && <p className="password-feedback password-feedback--error">{error}</p>}
              {successMessage && (
                <p className="password-feedback password-feedback--success">{successMessage}</p>
              )}

              <button
                type="submit"
                className="signup-btn"
                disabled={!passwordMatch || !agreeTerms || !captchaToken || isSubmitting || registerCooldownSeconds > 0}
              >
                {signUpButtonLabel}
              </button>
            </form>

            <div className="login-prompt">
              <p>
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="login-link">Inicia sesión</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
