import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    signInWithPopup,
    signOut,
    type Auth,
    type User,
} from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

function getFirebaseAuthInstance(): Auth {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase no está configurado. Faltan variables VITE_FIREBASE_*.");
  }

  firebaseApp ??= getApps()[0] ?? initializeApp(firebaseConfig);

  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
    void setPersistence(firebaseAuth, browserLocalPersistence);

    // Inicializar App Check con reCAPTCHA Enterprise
    if (typeof window !== "undefined") {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
    }


  }

  return firebaseAuth;
}

function normalizeFirebaseUser(user: User) {
  return {
    uid: user.uid,
    name: user.displayName?.trim() || "Usuario",
    email: user.email?.trim() || "",
  };
}

export function isFirebaseAuthEnabled(): boolean {
  return hasFirebaseConfig();
}

export async function signInWithGoogleFirebase(): Promise<{
  ok: boolean;
  message?: string;
  token?: string;
  user?: { uid: string; name: string; email: string };
}> {
  try {
    const auth = getFirebaseAuthInstance();
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const firebaseToken = await credential.user.getIdToken();

    return {
      ok: true,
      token: firebaseToken,
      user: normalizeFirebaseUser(credential.user),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo iniciar con Google.",
    };
  }
}

export async function signOutFirebaseSession(): Promise<void> {
  if (!hasFirebaseConfig()) return;

  try {
    const auth = getFirebaseAuthInstance();
    await signOut(auth);
  } catch {
    // Si falla signOut de Firebase, de todas formas se limpia sesión local.
  }
}
