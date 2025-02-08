import { 
    auth,
    db 
} from './firebase-config';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { 
    doc, 
    setDoc,
    getDoc 
} from 'firebase/firestore';

// User authentication service
export const AuthService = {
    // Register new user
    async register(email, password, username) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user profile in Firestore
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
    },

    // Login existing user
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout user
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    // Check if user is admin
    async isAdmin(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.data()?.role === 'admin';
        } catch (error) {
            console.error('Admin check error:', error);
            return false;
        }
    },

    // Password reset functionality
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },

    // Email verification
    async sendEmailVerification(user) {
        try {
            await sendEmailVerification(user);
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    },

    // Google Sign-in
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            return await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }
}; 