import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    return null;
                }

                return user;
            }
        })
    ],
    session: {
        strategy: 'jwt' as const,
    },
    secret: process.env.NEXTAUTH_SECRET || 'a_default_secret_for_development',
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token }) {
            const dbUser = await prisma.user.findFirst({
                where: {
                    email: token.email,
                },
            });

            if (!dbUser) {
                return token;
            }

            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image,
                points: dbUser.points,
                isAdmin: dbUser.isAdmin,
                addressLine1: dbUser.addressLine1,
                addressLine2: dbUser.addressLine2,
                city: dbUser.city,
                state: dbUser.state,
                zipCode: dbUser.zipCode,
                country: dbUser.country,
            };
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
                session.user.points = token.points as number;
                session.user.isAdmin = token.isAdmin as boolean;
                session.user.addressLine1 = token.addressLine1 as string | undefined;
                session.user.addressLine2 = token.addressLine2 as string | undefined;
                session.user.city = token.city as string | undefined;
                session.user.state = token.state as string | undefined;
                session.user.zipCode = token.zipCode as string | undefined;
                session.user.country = token.country as string | undefined;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
