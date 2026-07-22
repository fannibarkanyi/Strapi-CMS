import type { CurrentUser } from '../types';

const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
};

const JWT_STORAGE_KEY = 'srh_jwt';

interface StrapiResponse<T> {
    data: T;
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

export class StrapiClient {
    private readonly baseUrl: string;
    private jwt: string | null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.jwt = localStorage.getItem(JWT_STORAGE_KEY);
    }

    get isAuthenticated(): boolean {
        return this.jwt !== null;
    }

    async login(identifier: string, password: string) {
        const response = await fetch(`${this.baseUrl}/api/auth/local`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                identifier,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error.message);
        }

        this.jwt = data.jwt;
        localStorage.setItem(JWT_STORAGE_KEY, data.jwt);
    }

    logout() {
        this.jwt = null;
        localStorage.removeItem(JWT_STORAGE_KEY);
    }

    /**
     * @description Fetches the currently authenticated user, including their role.
     * Throws if there is no stored session or it's no longer valid.
     */
    async me(): Promise<CurrentUser> {
        const response = await fetch(`${this.baseUrl}/api/users/me?populate[role]=true`, {
            headers: {
                ...defaultHeaders,
                Authorization: `Bearer ${this.jwt}`,
            },
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        return response.json();
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const body = await response.json();

        if (!response.ok) {
            throw new Error(body?.error?.message || 'Request failed');
        }

        return body;
    }

    private authHeaders(): Record<string, string> {
        return this.jwt ? { ...defaultHeaders, Authorization: `Bearer ${this.jwt}` } : { ...defaultHeaders };
    }

    /**
     * @description Fetches data from the Strapi API.
     * @param endpoint The API endpoint to fetch data from (e.g., '/api/my-endpoint').
     * */
    async get<T>(endpoint: string): Promise<StrapiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.authHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * @description Sends a POST request to the Strapi API.
     * @param endpoint The API endpoint to send the POST request to (e.g., '/api/my-endpoint').
     * @param body The request body to be sent as JSON. This can be any JavaScript object that you want to send to the API.
     */
    async post<T>(endpoint: string, body: unknown): Promise<StrapiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify(body),
        });

        return this.handleResponse(response);
    }

    /**
     * @description Sends a PUT request to the Strapi API.
     * @param endpoint The API endpoint to send the PUT request to (e.g., '/api/my-endpoint').
     * @param body The request body to be sent as JSON. This can be any JavaScript object that you want to send to the API.
     */
    async put<T>(endpoint: string, body: unknown): Promise<StrapiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.authHeaders(),
            body: JSON.stringify(body),
        });

        return this.handleResponse(response);
    }
}

// Initialize the Strapi client with the base URL from env vars (vite project)
export const strapiClient = new StrapiClient(import.meta.env.VITE_STRAPI_BASE_URL || 'http://localhost:3001');
