// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { enableIndexedDbPersistence } from 'firebase/firestore';

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Version control for app updates
export const currentAppVersion = "1.0.0";

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser doesn\'t support persistence.');
    }
}); 