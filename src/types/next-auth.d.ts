import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user?: {
            id?: string;
            points?: number;
            isAdmin?: boolean;
            addressLine1?: string;
            addressLine2?: string;
            city?: string;
            state?: string;
            zipCode?: string;
            country?: string;
        } & DefaultSession['user'];
    }

    interface User {
        points?: number;
        isAdmin?: boolean;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    }
}
