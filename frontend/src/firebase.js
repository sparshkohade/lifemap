import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpXvEpRHf3i5kgTffcX_f_GG5udMjcfxQ",  // your correct key
  authDomain: "lifemap-ddc26.firebaseapp.com",
  projectId: "lifemap-ddc26",
  storageBucket: "lifemap-ddc26.appspot.com",
  messagingSenderId: "402026251801",
  appId: "1:402026251801:web:358dcc3441400bb1698c88",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };