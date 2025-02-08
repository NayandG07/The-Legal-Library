import { messaging } from './firebase-config.js';
import { getToken, onMessage } from 'firebase/messaging';

export const NotificationService = {
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const token = await getToken(messaging);
                return token;
            }
        } catch (error) {
            console.error('Notification permission error:', error);
        }
    },

    async subscribeToNewBooks() {
        onMessage(messaging, (payload) => {
            new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: '/icons/icon-192x192.png'
            });
        });
    }
}; 