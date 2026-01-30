/**
 * File Upload Service for QuickPrint Frontend
 * Uploads files to S3/MinIO backend and returns file metadata
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const uploadService = {
    /**
     * Upload a file to the server
     * @param {File} file - The file to upload
     * @returns {Promise<{fileId: string, url: string, name: string, size: number, mimeType: string, checksum: string}>}
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');

        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Failed to upload file');
        }

        return response.json();
    },

    /**
     * Get signed download URL for a file
     * @param {string} fileId - The file ID
     * @returns {Promise<{downloadUrl: string, expiresIn: number}>}
     */
    async getDownloadUrl(fileId) {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`${API_BASE}/api/files/${fileId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get download URL');
        }

        return response.json();
    },

    /**
     * Mark file as printed (partner callback)
     * @param {string} fileId - The file ID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async markAsPrinted(fileId) {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`${API_BASE}/api/files/${fileId}/printed`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to mark file as printed');
        }

        return response.json();
    },

    /**
     * Get upload info (max size, allowed types, etc.)
     * @returns {Promise<{maxFileSize: string, allowedTypes: string[], storageConfigured: boolean}>}
     */
    async getUploadInfo() {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`${API_BASE}/api/upload/info`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get upload info');
        }

        return response.json();
    },
};
