/**
 * QuickPrint API Client
 * Centralized HTTP client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

class ApiClient {
    constructor() {
        this.baseUrl = `${API_BASE_URL}${API_PREFIX}`;
    }

    /**
     * Get the stored access token
     */
    getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    /**
     * Get the stored refresh token
     */
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    /**
     * Store tokens after login
     */
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    /**
     * Clear all stored tokens
     */
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    /**
     * Build headers for requests
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    async handleResponse(response, skipAuthRefresh = false) {
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 401 && !skipAuthRefresh) {
                const refreshed = await this.tryRefreshToken();
                if (!refreshed) {
                    this.clearTokens();
                    window.location.href = '/login';
                    throw new Error('Session expired. Please login again.');
                }
                return { _retry: true };
            }

            const error = new Error(data?.error || data?.message || `HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            // Include error code for special handling (e.g., NOT_REGISTERED)
            if (data?.code) {
                error.code = data.code;
            }
            throw error;
        }

        return data;
    }

    /**
     * Try to refresh the access token
     */
    async tryRefreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) return false;

            const data = await response.json();
            this.setTokens(data.accessToken, data.refreshToken);
            return true;
        } catch {
            return false;
        }
    }

    async get(endpoint, options = {}) {
        const skipAuth = options.auth === false;
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders(!skipAuth),
        });

        const result = await this.handleResponse(response, skipAuth);

        if (result?._retry) {
            return this.get(endpoint, options);
        }

        return result;
    }

    async post(endpoint, body, options = {}) {
        const skipAuth = options.auth === false;
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(!skipAuth),
            body: JSON.stringify(body),
        });

        const result = await this.handleResponse(response, skipAuth);

        if (result?._retry) {
            return this.post(endpoint, body, options);
        }

        return result;
    }

    /**
     * Make a PUT request
     */
    async put(endpoint, body, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(options.auth !== false),
            body: JSON.stringify(body),
        });

        const result = await this.handleResponse(response);

        if (result?._retry) {
            return this.put(endpoint, body, options);
        }

        return result;
    }

    /**
     * Make a PATCH request
     */
    async patch(endpoint, body, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: this.getHeaders(options.auth !== false),
            body: JSON.stringify(body),
        });

        const result = await this.handleResponse(response);

        if (result?._retry) {
            return this.patch(endpoint, body, options);
        }

        return result;
    }

    /**
     * Make a DELETE request
     */
    async delete(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(options.auth !== false),
        });

        const result = await this.handleResponse(response);

        if (result?._retry) {
            return this.delete(endpoint, options);
        }

        return result;
    }

    /**
     * Upload a file
     */
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);

        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        });

        const headers = {};
        const token = this.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        return this.handleResponse(response);
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
