import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '../../environments/environment';

/**
 * Inicialización segura de Firebase para FinanZen.
 * Lee las credenciales inyectadas desde el archivo de entorno (que proviene de .env).
 * Previene inicializaciones duplicadas con getApps().
 */
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(environment.firebase) : getApp();

export const firestore: Firestore = getFirestore(firebaseApp);
export const auth: Auth = getAuth(firebaseApp);
