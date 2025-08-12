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
                shippingRequests: {
                    include: {
                        userCards: {
                            include: { card: true },
                        },
                    },
                    orderBy: { requestDate: 'desc' },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ shippingRequests: user.shippingRequests });

    } catch (error) {
        console.error('Failed to fetch shipping history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
