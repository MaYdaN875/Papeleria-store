import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import RecaptchaCheckbox from "../components/ui/RecaptchaCheckbox";
import {
    fetchStoreCustomerSession,
    loginStoreCustomer,
    loginWithFirebaseToken,
    logoutStoreCustomer,
    resendStoreEmailVerification,
} from "../services/customerApi";
import { isFirebaseAuthEnabled, signInWithGoogleFirebase, signOutFirebaseSession } from "../services/firebaseAuth";
import "../styles/login.css";
import "../styles/password-recovery.css";
import { syncCartCount } from "../utils/cart";
import {
    clearStoreSession,
    getStoreUser,
    getStoreUserProvider,
    getStoreUserToken,
    setStoreSession,
} from "../utils/storeSession";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loginCooldownSeconds, setLoginCooldownSeconds] = useState(0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(() => !!getStoreUserToken());
  const [sessionUserName, setSessionUserName] = useState(() => getStoreUser()?.name ?? "");
  const [sessionUserEmail, setSessionUserEmail] = useState(() => getStoreUser()?.email ?? "");
  const isFirebaseEnabled = isFirebaseAuthEnabled();

  useEffect(() => {
    globalThis.scrollTo({ top: 0, behavior: "auto" });

    async function verifySession() {
      const token = getStoreUserToken();
      const currentUser = getStoreUser();
      if (!token || !currentUser) {
        setSessionUserName("");
        setSessionUserEmail("");
        setIsCheckingSession(false);
        return;
      }

      setSessionUserName(currentUser.name);
      setSessionUserEmail(currentUser.email);

      if (currentUser.provider === "firebase") {
        setIsCheckingSession(false);
        return;
      }

      const result = await fetchStoreCustomerSession(token);
      if (!result.ok || !result.user) {
        clearStoreSession();
        syncCartCount();
      } else {
        setSessionUserName(result.user.name);
        setSessionUserEmail(result.user.email);
      }

      setIsCheckingSession(false);
    }

    void verifySession();
  }, []);

  useEffect(() => {
    if (loginCooldownSeconds <= 0) return;

    const timeoutId = globalThis.setTimeout(() => {
      setLoginCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [loginCooldownSeconds]);

  const hasActiveSession = !!sessionUserEmail;
  let loginButtonLabel = "Iniciar Sesión";
  if (isSubmitting) {
    loginButtonLabel = "Entrando...";
  } else if (loginCooldownSeconds > 0) {
    loginButtonLabel = `Intenta en ${loginCooldownSeconds}s`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginCooldownSeconds > 0) {
      setError(`Demasiados intentos. Espera ${loginCooldownSeconds}s para reintentar.`);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfoMessage("");
    setShowResendVerification(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setError("Correo y contraseña son obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación \"No soy un robot\".");
      setIsSubmitting(false);
      return;
    }

    const result = await loginStoreCustomer({
      email: normalizedEmail,
      password,
      recaptchaToken: captchaToken,
    });

    if (!result.ok || !result.token || !result.user) {
      if ((result.retryAfterSeconds ?? 0) > 0) {
        setLoginCooldownSeconds(Math.ceil(result.retryAfterSeconds ?? 0));
      }
      if (result.requiresEmailVerification) {
        setShowResendVerification(true);
      }
      setError(result.message ?? "No se pudo iniciar sesión.");
      setIsSubmitting(false);
      return;
    }

    setStoreSession(result.token, {
      ...result.user,
      provider: "api",
    });
    syncCartCount();
    navigate(returnTo, { replace: true });
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Ingresa tu correo para reenviar la verificacion.");
      return;
    }

    setIsResendingVerification(true);
    setError("");
    setInfoMessage("");

    const result = await resendStoreEmailVerification({ email: normalizedEmail });
    if (!result.ok) {
      if ((result.retryAfterSeconds ?? 0) > 0) {
        setLoginCooldownSeconds(Math.ceil(result.retryAfterSeconds ?? 0));
      }
      setError(result.message ?? "No se pudo reenviar el correo de verificacion.");
      setIsResendingVerification(false);
      return;
    }

    setInfoMessage(result.message ?? "Si aplica, enviamos un nuevo enlace de verificacion.");
    setIsResendingVerification(false);
  }

  async function handleGoogleLogin() {
    setError("");
    setIsGoogleSubmitting(true);

    const firebaseResult = await signInWithGoogleFirebase();
    if (!firebaseResult.ok || !firebaseResult.token || !firebaseResult.user?.email) {
      setError(firebaseResult.message ?? "No se pudo iniciar sesión con Google.");
      setIsGoogleSubmitting(false);
      return;
    }

    // Enviar token de Firebase al backend para crear/vincular usuario en la BD.
    const apiResult = await loginWithFirebaseToken(firebaseResult.token);
    if (!apiResult.ok || !apiResult.token || !apiResult.user) {
      setError(apiResult.message ?? "No se pudo vincular la cuenta de Google.");
      setIsGoogleSubmitting(false);
      return;
    }

    setStoreSession(apiResult.token, {
      ...apiResult.user,
      provider: "api",
    });
    syncCartCount();
    navigate(returnTo, { replace: true });
  }

  async function handleLogout() {
    const provider = getStoreUserProvider();
    const token = getStoreUserToken();

    if (provider === "firebase") {
      await signOutFirebaseSession();
    } else if (token) {
      await logoutStoreCustomer(token);
    }

    clearStoreSession();
    syncCartCount();
    setSessionUserName("");
    setSessionUserEmail("");
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setIsGoogleSubmitting(false);
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-visual">
          <div className="login-visual-content">
            <button type="button" className="back-to-home-btn" onClick={() => navigate("/")}>
              <span>←</span> Volver al inicio
            </button>

            <h1>Bienvenido de vuelta</h1>
            <p>Accede a tu cuenta para ver tus pedidos y disfrutar de ofertas exclusivas</p>

            <div className="login-visual-features">
              <div className="feature-item">
                <span className="feature-icon">📦</span>
                <p>Gestiona tus pedidos</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <p>Ofertas exclusivas</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <p>Historial de compras</p>
              </div>
            </div>

            <div className="login-visual-decoration">
              <div className="shape shape-1" />
              <div className="shape shape-2" />
              <div className="shape shape-3" />
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-form-content">
            <div className="login-header">
              <h2>{hasActiveSession ? "Tu cuenta" : "Iniciar Sesión"}</h2>
              <p>
                {hasActiveSession
                  ? "Sesión activa en la tienda."
                  : "Accede a tu cuenta de papelería"}
              </p>
            </div>

            {hasActiveSession ? (
              <div className="login-form">
                <p>
                  <strong>Nombre:</strong> {sessionUserName}
                </p>
                <p>
                  <strong>Correo:</strong> {sessionUserEmail}
                </p>
                <button type="button" className="login-btn" onClick={() => navigate("/cart")}>
                  Ir a mi carrito
                </button>
                <button
                  type="button"
                  className="logout-secondary-btn"
                  onClick={() => void handleLogout()}
                >
                  <i className="fas fa-sign-out-alt" aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
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

                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <span className="input-icon">🔒</span>
                  </div>
                </div>

                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Recuérdame</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={() => navigate("/forgot-password")}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {error && <p className="password-feedback password-feedback--error">{error}</p>}
                {infoMessage && (
                  <p className="password-feedback password-feedback--success">{infoMessage}</p>
                )}
                {showResendVerification && (
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={() => void handleResendVerification()}
                    disabled={isResendingVerification || loginCooldownSeconds > 0}
                  >
                    {isResendingVerification ? "Reenviando..." : "Reenviar correo de verificación"}
                  </button>
                )}

                <RecaptchaCheckbox
                  onVerify={(token: string) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                />

                <button
                  type="submit"
                  className="login-btn"
                  disabled={!captchaToken || isSubmitting || isCheckingSession || loginCooldownSeconds > 0}
                >
                  {loginButtonLabel}
                </button>

                {isFirebaseEnabled && (
                  <>
                    <div className="divider">
                      <span>O continúa con</span>
                    </div>
                    <div className="social-login social-login--single">
                      <button
                        type="button"
                        className="social-btn google-btn"
                        onClick={() => void handleGoogleLogin()}
                        disabled={isGoogleSubmitting}
                      >
                        <span>{isGoogleSubmitting ? "Conectando..." : "Google"}</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            <div className="signup-prompt">
              {hasActiveSession ? (
                <p>Ya hay una sesión activa.</p>
              ) : (
                <p>
                  ¿No tienes cuenta?{" "}
                  <Link to="/signup" className="signup-link">
                    Regístrate
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
