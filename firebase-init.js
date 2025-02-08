// Import Firebase from CDN modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyBixbCX6bC5vb59HuxLlLFY-ngyOSdo30w",
    authDomain: "the-legal-library.firebaseapp.com",
    projectId: "the-legal-library",
    storageBucket: "the-legal-library.firebasestorage.app",
    messagingSenderId: "30321248866",
    appId: "1:30321248866:web:cb24a34294d30785e2df3b",
    measurementId: "G-03BGZTYLLV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 