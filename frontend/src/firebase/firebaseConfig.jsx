import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD6aDxiG3oPJszMJVqHJrXPTxC4_7QzYpo",
    authDomain: "teamio-test.firebaseapp.com",
    databaseURL: "https://teamio-test-default-rtdb.firebaseio.com",
    projectId: "teamio-test",
    storageBucket: "teamio-test.firebasestorage.app",
    messagingSenderId: "772932077916",
    appId: "1:772932077916:web:029a5791f6345a7689d999",
    measurementId: "G-58R85F6D30"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;