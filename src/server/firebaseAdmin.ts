
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!getApps().length) {
  console.log("Initializing Firebase Admin");


  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials from .env.local were not loaded correctly.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
    
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export const getAdminDb = () => admin.firestore();

export const verifyIdToken = (token: string) => {
  if (!token) {
    throw new Error('ID token is required for verification.');
  }
  return admin.auth().verifyIdToken(token);
};