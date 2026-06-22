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
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  enableIndexedDbPersistence 
} from "firebase/firestore";

// Read Firebase config retrieved during the setup phase
const firebaseConfig = {
  apiKey: "AIzaSyDdOHaq-VBapNBnxrpc-yRO6UR_uGpZMIU",
  authDomain: "plated-complex-qhnbb.firebaseapp.com",
  projectId: "plated-complex-qhnbb",
  storageBucket: "plated-complex-qhnbb.firebasestorage.app",
  messagingSenderId: "446624167546",
  appId: "1:446624167546:web:69b0c55a747b37dc63edc3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence for better user experience
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence: Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence: The current browser does not support all of the features required to enable persistence.');
    }
  });
} catch (e) {
  console.warn('Firestore persistence not available:', e);
}

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
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    throw error;
  }
};

// Persist user finance data securely in Firestore
export const saveUserFinanceData = async (uid: string, data: any): Promise<void> => {
  try {
    const docRef = doc(db, "user_finance_data", uid);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error synchronizing user data with Firestore:", error);
    throw error;
  }
};
