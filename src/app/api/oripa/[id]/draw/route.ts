import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type Props = {
    params: { id: string };
};

export async function POST(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const oripaId = params.id;

        // Get Oripa and User data in a single transaction to ensure data consistency
        const [oripa, user] = await prisma.$transaction([
            prisma.oripa.findUnique({ 
                where: { id: oripaId },
                include: { cards: true }
            }),
            prisma.user.findUnique({ where: { email: session.user.email } })
        ]);

        if (!oripa || oripa.cards.length === 0) {
            return NextResponse.json({ error: 'Pack not found or is empty' }, { status: 404 });
        }
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (user.points < oripa.price) {
            return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
        }

        // --- Gacha Logic ---
        const randomIndex = Math.floor(Math.random() * oripa.cards.length);
        const drawnCardRelation = oripa.cards[randomIndex];
        const cardIdToAward = drawnCardRelation.cardId;

        // --- Database Transaction ---
        // 1. Deduct points from user
        // 2. Add card to user's collection
        // 3. Get the drawn card's details
        const [updatedUser, , drawnCard] = await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { points: { decrement: oripa.price } },
            }),
            prisma.userCard.create({
                data: {
                    userId: user.id,
                    cardId: cardIdToAward,
                },
            }),
            prisma.card.findUnique({ where: { id: cardIdToAward } })
        ]);

        return NextResponse.json({ card: drawnCard, user: updatedUser });

    } catch (error) {
        console.error('Gacha draw error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}