export const SearchService = {
    async searchBooks(params) {
        try {
            let q = query(collection(db, 'books'));
            
            if (params.category) {
                q = query(q, where('category', '==', params.category));
            }
            
            if (params.priceRange) {
                q = query(q, 
                    where('price', '>=', params.priceRange.min),
                    where('price', '<=', params.priceRange.max)
                );
            }
            
            if (params.rating) {
                q = query(q, where('averageRating', '>=', params.rating));
            }
            
            if (params.sortBy) {
                q = query(q, orderBy(params.sortBy, params.sortOrder || 'desc'));
            }
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
}; 