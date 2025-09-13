import { log, warn } from '@/utils/logger';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

// CI環境ではFirebase認証をスキップ
const isCI = process.env.CI === 'true';
const skipFirebaseAuth = process.env.SKIP_FIREBASE_AUTH === 'true';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-bucket',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'dummy-sender',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dummy-app',
};

let app: any = null;
let auth: Auth | null = null;

if (!isCI && !skipFirebaseAuth) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Firebase Auth Emulatorに接続（テスト実行時のみ）
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true' ||
    (typeof window !== 'undefined' &&
      window.location.hostname === 'localhost' &&
      process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST);

  if (isTestEnvironment) {
    const host = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST ?? 'localhost:9099';
    try {
      connectAuthEmulator(auth, `http://${host}`, { disableWarnings: true });
      log('Connected to Firebase Auth Emulator');
    } catch (error) {
      warn('Failed to connect to Firebase Auth Emulator:', error);
    }
  }
}

export { auth };
