import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { 
    doc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    getDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export class BookService {
    // Add new book
    static async addBook(bookData, coverImage, pdfFile) {
        try {
            const storage = getStorage();
            const db = getFirestore();

            if (!coverImage || !pdfFile) {
                throw new Error('Both cover image and PDF file are required');
            }

            // Validate file types
            if (!coverImage.type.startsWith('image/')) {
                throw new Error('Cover file must be an image');
            }

            if (pdfFile.type !== 'application/pdf') {
                throw new Error('Book file must be a PDF');
            }

            console.log('Uploading cover image...'); // Debug log
            const coverRef = ref(storage, `covers/${Date.now()}_${coverImage.name}`);
            await uploadBytes(coverRef, coverImage);
            const coverUrl = await getDownloadURL(coverRef);

            console.log('Uploading PDF file...'); // Debug log
            const pdfRef = ref(storage, `pdfs/${Date.now()}_${pdfFile.name}`);
            await uploadBytes(pdfRef, pdfFile);
            const pdfUrl = await getDownloadURL(pdfRef);

            console.log('Adding to Firestore...'); // Debug log
            const bookRef = await addDoc(collection(db, 'books'), {
                ...bookData,
                coverUrl,
                pdfUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return bookRef.id;
        } catch (error) {
            console.error('Error in addBook:', error);
            throw error;
        }
    }

    // Get books by category
    async getBooksByCategory(category) {
        try {
            const q = query(collection(db, 'books'), where('category', '==', category));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get books error:', error);
            throw error;
        }
    }

    // Update book
    async updateBook(bookId, updateData) {
        try {
            await updateDoc(doc(db, 'books', bookId), {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Update book error:', error);
            throw error;
        }
    }

    // Delete book
    async deleteBook(bookId) {
        try {
            await deleteDoc(doc(db, 'books', bookId));
        } catch (error) {
            console.error('Delete book error:', error);
            throw error;
        }
    }

    async addReview(bookId, userId, rating, comment) {
        try {
            const reviewRef = await addDoc(collection(db, 'reviews'), {
                bookId,
                userId,
                rating,
                comment,
                createdAt: new Date().toISOString()
            });

            // Update book's average rating
            const bookRef = doc(db, 'books', bookId);
            const bookDoc = await getDoc(bookRef);
            const currentRating = bookDoc.data().averageRating || 0;
            const totalReviews = bookDoc.data().totalReviews || 0;
            
            const newRating = ((currentRating * totalReviews) + rating) / (totalReviews + 1);
            
            await updateDoc(bookRef, {
                averageRating: newRating,
                totalReviews: totalReviews + 1
            });

            return reviewRef.id;
        } catch (error) {
            console.error('Add review error:', error);
            throw error;
        }
    }

    async getAllBooks() {
        try {
            const snapshot = await getDocs(collection(db, 'books'));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get all books error:', error);
            throw error;
        }
    }

    subscribeToBooks(callback) {
        return onSnapshot(collection(db, 'books'), (snapshot) => {
            const books = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(books);
        });
    }
} 