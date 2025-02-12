import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';

// User authentication service
export class AuthService {
    // Register new user
    static async register(email, password, username) {
        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user profile in Firestore
            const db = getFirestore();
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                username,
                email,
                role: 'user',
                createdAt: new Date().toISOString()
            });

            return userCredential.user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login existing user
    static async login(email, password) {
        const auth = getAuth();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout user
    static async logout() {
        const auth = getAuth();
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    // Check if user is admin
    static async isAdmin(uid) {
        const db = getFirestore();
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() && userDoc.data().role === 'admin';
        } catch (error) {
            console.error('Admin check error:', error);
            return false;
        }
    }

    // Password reset functionality
    static async resetPassword(email) {
        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    // Email verification
    static async sendEmailVerification(user) {
        const auth = getAuth();
        try {
            await sendEmailVerification(user);
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }

    // Google Sign-in
    static async signInWithGoogle() {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            return await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }
} 