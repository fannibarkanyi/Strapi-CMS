const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
};

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
    private jwt: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
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
    }

    /**
     * @description Fetches data from the Strapi API.
     * @param endpoint The API endpoint to fetch data from (e.g., '/api/my-endpoint').
     * */
    async get<T>(endpoint: string): Promise<StrapiResponse<T>> {
        let headers = {...defaultHeaders};

        if (this.jwt) {
            headers = {
                ...headers,
                Authorization: `Bearer ${this.jwt}`,
            };
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers,
        });

        return response.json()
    }

    /**
     * @description Sends a POST request to the Strapi API.
     * @param endpoint The API endpoint to send the POST request to (e.g., '/api/my-endpoint').
     * @param body The request body to be sent as JSON. This can be any JavaScript object that you want to send to the API.
     */
    async post<T>(endpoint: string, body: unknown): Promise<StrapiResponse<T>> {
        let headers = {...defaultHeaders};

        if (this.jwt) {
            headers = {
                ...headers,
                Authorization: `Bearer ${this.jwt}`,
            };
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        return response.json()
    }

    /**
     * @description Sends a PUT request to the Strapi API.
     * @param endpoint The API endpoint to send the PUT request to (e.g., '/api/my-endpoint').
     * @param body The request body to be sent as JSON. This can be any JavaScript object that you want to send to the API.
     */
    async put<T>(endpoint: string, body: unknown): Promise<StrapiResponse<T>> {
        let headers = {...defaultHeaders};

        if (this.jwt) {
            headers = {
                ...headers,
                Authorization: `Bearer ${this.jwt}`,
            };
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });

        return response.json()
    }
}

// Initialize the Strapi client with the base URL from env vars (vite project)
export const strapiClient = new StrapiClient(import.meta.env.VITE_STRAPI_BASE_URL || 'http://localhost:3001');
