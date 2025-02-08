import { db } from './firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { currentAppVersion } from './firebase-config';

export const UpdateService = {
    // Check for updates
    async checkForUpdates() {
        try {
            const versionDoc = await getDoc(doc(db, 'app', 'version'));
            const latestVersion = versionDoc.data().version;

            if (latestVersion !== currentAppVersion) {
                return {
                    hasUpdate: true,
                    latestVersion,
                    downloadUrl: versionDoc.data().downloadUrl
                };
            }

            return { hasUpdate: false };
        } catch (error) {
            console.error('Update check error:', error);
            throw error;
        }
    }
}; 