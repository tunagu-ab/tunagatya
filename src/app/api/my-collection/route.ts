import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                cards: {
                    include: {
                        card: true, // Include the actual card details
                    },
                    orderBy: { createdAt: 'desc' }, // Order by when the card was acquired
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return UserCard entries with included Card details
        return NextResponse.json({ cards: user.cards });

    } catch (error) {
        console.error('Failed to fetch collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
