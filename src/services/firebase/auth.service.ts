/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, googleProvider } from '../../utils/firebase';
import { signInWithPopup, signInWithRedirect, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';

export const authService = {
  async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google Sign-In Failure:", error);
      throw error;
    }
  },

  async signInWithGoogleRedirect(): Promise<void> {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Google Redirect Sign-In Failure:", error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-Out Failure:", error);
      throw error;
    }
  }
};
