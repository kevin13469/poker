// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'; // Uncomment if you need Firestore

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDP8tf7HLz74FrQ0Orr3AnLlK98VBUdqt8",
  authDomain: "poker-99f9d.firebaseapp.com",
  projectId: "poker-99f9d",
  storageBucket: "poker-99f9d.firebasestorage.app",
  messagingSenderId: "837872974756",
  appId: "1:837872974756:web:65b6952ab76ee789ffdf31",
  measurementId: "G-PTSMJFK532"
};

// 檢查關鍵的 Firebase 設定值是否缺失
const essentialKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId'];
for (const key of essentialKeys) {
  if (!firebaseConfig[key]) {
    console.warn(
      `Firebase 設定警告：環境變數 NEXT_PUBLIC_FIREBASE_${key.toUpperCase()} 未設定或為空。` +
      `這可能會導致 Firebase 功能 (例如登入/註冊) 失效。請檢查您的 .env 檔案並重新啟動開發伺服器。`
    );
  }
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app); // Uncomment if you need Firestore

export { app, auth, db };
