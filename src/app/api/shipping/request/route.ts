import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { isAdmin } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { userCardIds } = body; // Array of UserCard IDs to ship

        if (!userCardIds || !Array.isArray(userCardIds) || userCardIds.length === 0) {
            return NextResponse.json({ error: 'No cards selected for shipping' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, addressLine1: true, addressLine2: true, city: true, state: true, zipCode: true, country: true, cards: { where: { id: { in: userCardIds } } } }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user has a shipping address
        if (!user.addressLine1 || !user.city || !user.zipCode || !user.country) {
            return NextResponse.json({ error: 'Shipping address is incomplete. Please update your profile.' }, { status: 400 });
        }

        // Check if all selected cards belong to the user and are not already shipped/requested
        if (user.cards.length !== userCardIds.length) {
            return NextResponse.json({ error: 'Some selected cards do not belong to you or are invalid.' }, { status: 400 });
        }
        for (const userCard of user.cards) {
            if (userCard.isShipped || userCard.shippingRequestId) {
                return NextResponse.json({ error: 'Some selected cards are already part of a shipping request or have been shipped.' }, { status: 400 });
            }
        }

        // Construct shipping address string
        const shippingAddress = `${user.addressLine1}, ${user.addressLine2 ? user.addressLine2 + ', ' : ''}${user.city}, ${user.state}, ${user.zipCode}, ${user.country}`;

        // Create shipping request and update UserCards in a transaction
        const shippingRequest = await prisma.$transaction(async (tx) => {
            const newRequest = await tx.shippingRequest.create({
                data: {
                    userId: user.id,
                    shippingAddress: shippingAddress,
                    status: "PENDING",
                    requestDate: new Date(),
                },
            });

            await tx.userCard.updateMany({
                where: { id: { in: userCardIds } },
                data: {
                    shippingRequestId: newRequest.id,
                    isShipped: true, // Mark as requested for shipping
                },
            });

            return newRequest;
        });

        return NextResponse.json({ message: 'Shipping request submitted successfully!', shippingRequest });

    } catch (error) {
        console.error('Shipping request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
