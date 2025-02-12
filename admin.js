import { BookService } from './book-service.js';
import { AuthService } from './auth-service.js';

// Check admin status
document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.currentUser;
    if (!user || !(await AuthService.isAdmin(user.uid))) {
        window.location.href = '/index.html';
        return;
    }

    // Initialize book form
    const bookForm = document.getElementById('book-form');
    bookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookData = {
            title: e.target.title.value,
            author: e.target.author.value,
            category: e.target.category.value,
            price: parseFloat(e.target.price.value),
            description: e.target.description.value
        };
        
        const coverImage = e.target.cover.files[0];

        try {
            await BookService.addBook(bookData, coverImage);
            alert('Book added successfully!');
            bookForm.reset();
        } catch (error) {
            alert(error.message);
        }
    });
}); 