import { UpdateService } from './update-service.js';

// Check for updates on app load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const updateStatus = await UpdateService.checkForUpdates();
        if (updateStatus.hasUpdate) {
            const shouldUpdate = confirm(
                `A new version (${updateStatus.latestVersion}) is available. Would you like to update?`
            );
            
            if (shouldUpdate) {
                window.location.href = updateStatus.downloadUrl;
            }
        }
    } catch (error) {
        console.error('Update check failed:', error);
    }
}); 