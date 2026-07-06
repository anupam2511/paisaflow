/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';

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

export const firestoreService = {
  async getUserFinanceData(uid: string): Promise<DocumentData | null> {
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
  },

  async saveUserFinanceData(uid: string, data: any): Promise<void> {
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
  }
};
