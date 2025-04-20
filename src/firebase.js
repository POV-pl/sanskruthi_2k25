// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFEIDnY9E1lj5CHr92VV60EkfVvIYguDw",
  authDomain: "sanskruthi-2k25.firebaseapp.com",
  projectId: "sanskruthi-2k25",
  storageBucket: "sanskruthi-2k25.firebasestorage.app",
  messagingSenderId: "736386796106",
  appId: "1:736386796106:web:1508347887438bcd2cf4b3",
  measurementId: "G-MB80QNLVL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, db, auth, storage ,analytics };
