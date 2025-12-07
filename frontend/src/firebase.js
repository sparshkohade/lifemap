import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBMEcCWTx6CFhSUyj1Ib7311PCt6M4Jjg",
  authDomain: "lifemap-6b8a3.firebaseapp.com",
  projectId: "lifemap-6b8a3",
  storageBucket: "lifemap-6b8a3.firebasestorage.app",
  messagingSenderId: "803065785400",
  appId: "1:803065785400:web:cd273ae4fb8b496c884acd",
  measurementId: "G-FW5T4W93GN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
