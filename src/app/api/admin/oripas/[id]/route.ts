import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/auth';

type Props = {
    params: { id: string };
};

export async function GET(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const oripaId = params.id;
        const oripa = await prisma.oripa.findUnique({
            where: { id: oripaId },
            include: {
                cards: {
                    include: { card: true },
                },
            },
        });

        if (!oripa) {
            return NextResponse.json({ error: 'Oripa not found' }, { status: 404 });
        }

        return NextResponse.json(oripa);
    } catch (error) {
        console.error('Failed to fetch oripa:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const oripaId = params.id;
        const body = await request.json();
        const { name, description, price, cardIds } = body;

        if (!name || !description || !price || !cardIds || !Array.isArray(cardIds)) {
            return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
        }

        // Use a transaction to update Oripa and its associated cards
        const updatedOripa = await prisma.$transaction(async (tx) => {
            // 1. Delete existing OripaCard entries for this Oripa
            await tx.oripaCard.deleteMany({
                where: { oripaId: oripaId },
            });

            // 2. Update Oripa details
            const oripa = await tx.oripa.update({
                where: { id: oripaId },
                data: {
                    name,
                    description,
                    price,
                },
            });

            // 3. Create new OripaCard entries
            await tx.oripaCard.createMany({
                data: cardIds.map((cardId: string) => ({
                    oripaId: oripa.id,
                    cardId: cardId,
                })),
            });

            return oripa;
        });

        return NextResponse.json(updatedOripa);
    } catch (error) {
        console.error('Failed to update oripa:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const oripaId = params.id;

        // Delete associated OripaCard entries first, then the Oripa itself
        await prisma.$transaction(async (tx) => {
            await tx.oripaCard.deleteMany({
                where: { oripaId: oripaId },
            });
            await tx.oripa.delete({
                where: { id: oripaId },
            });
        });

        return NextResponse.json({ message: 'Oripa deleted successfully' });
    } catch (error) {
        console.error('Failed to delete oripa:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
