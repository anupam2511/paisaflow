import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore,
  memoryLocalCache,
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";

import firebaseAppletConfig from "../../firebase-applet-config.json";

// Allow overriding via environment variables (for custom production hosting like Vercel/Netlify)
const metaEnv = (import.meta as any).env || {};

const activeFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId,
};

const envDbId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
const appletDbId = (firebaseAppletConfig as any).firestoreDatabaseId;

// If we are overriding configuration via custom project environment variables,
// do not fall back to the AI Studio sandbox database ID (which won't exist in the custom project).
const isCustomProject = !!(
  metaEnv.VITE_FIREBASE_PROJECT_ID || 
  metaEnv.VITE_FIREBASE_API_KEY || 
  metaEnv.VITE_FIREBASE_APP_ID
);

const cleanDatabaseId = (envDbId && envDbId !== "(default)") 
  ? envDbId 
  : (isCustomProject ? undefined : (appletDbId && appletDbId !== "(default)" ? appletDbId : undefined));

// Initialize Firebase
const app = initializeApp(activeFirebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with memory-only cache for pure real-time synchronization
const initFirestore = () => {
  try {
    return initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, cleanDatabaseId);
  } catch (err) {
    console.warn("Failed to initialize Firestore with options, falling back to default getFirestore:", err);
    return getFirestore(app, cleanDatabaseId);
  }
};

export const db = initFirestore();

// Signs in the user using Google Auth Popup
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Failure:", error);
    throw error;
  }
};

// Signs in the user using Google Auth Redirect
export const signInWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google Redirect Sign-In Failure:", error);
    throw error;
  }
};

// Signs out the current authenticated user
export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-Out Failure:", error);
    throw error;
  }
};

// Retrieve user finance data from Firestore or fallback to a custom template
export const getUserFinanceData = async (uid: string): Promise<any | null> => {
  try {
    const docRef = doc(db, "user_finance_data", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.toLowerCase().includes("offline") || msg.toLowerCase().includes("unavailable") || error?.code === "unavailable") {
      console.warn("Firestore offline or unavailable when fetching user data:", msg);
    } else {
      console.error("Error fetching user data from Firestore:", error);
    }
    throw error;
  }
};

// Helper to recursively remove all keys with undefined values to prevent Firestore serialization errors
const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  const cleanObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== undefined) {
        cleanObj[key] = removeUndefined(val);
      }
    }
  }
  return cleanObj;
};

// Persist user finance data securely in Firestore
export const saveUserFinanceData = async (uid: string, data: any): Promise<void> => {
  try {
    const docRef = doc(db, "user_finance_data", uid);
    const cleanedData = removeUndefined(data);
    await setDoc(docRef, cleanedData, { merge: true });
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.toLowerCase().includes("offline") || msg.toLowerCase().includes("unavailable") || error?.code === "unavailable") {
      console.warn("Firestore offline or unavailable when synchronizing data (write will queue locally):", msg);
    } else {
      console.error("Error synchronizing user data with Firestore:", error);
    }
    throw error;
  }
};
