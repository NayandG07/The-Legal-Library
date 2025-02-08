export const RecommendationService = {
    async getRecommendations(userId) {
        try {
            // Get user's reading history
            const userHistory = await getUserReadingHistory(userId);
            
            // Get user's preferred categories
            const preferences = await getUserPreferences(userId);
            
            // Query similar books
            const recommendedBooks = await query(
                collection(db, 'books'),
                where('category', 'in', preferences),
                orderBy('averageRating', 'desc'),
                limit(10)
            );

            return recommendedBooks.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Recommendation error:', error);
            throw error;
        }
    }
}; 