import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { isAdmin } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const shippingRequests = await prisma.shippingRequest.findMany({
            include: {
                user: { select: { name: true, email: true } }, // Include user details
                userCards: { include: { card: true } }, // Include associated cards
            },
            orderBy: { requestDate: 'desc' },
        });
        return NextResponse.json(shippingRequests);
    } catch (error) {
        console.error('Failed to fetch shipping requests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
