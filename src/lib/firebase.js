import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCKPz9y8KegOVDdqXjJpszfA__Tuhjco3o",
  authDomain: "piggypaths.firebaseapp.com",
  projectId: "piggypaths",
  storageBucket: "piggypaths.firebasestorage.app",
  messagingSenderId: "723829599396",
  appId: "1:723829599396:web:71f8f9dc1c0e7d82900a31",
  measurementId: "G-P9T3TP1MS8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const provider = new GoogleAuthProvider();

export default app;
