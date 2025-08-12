import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/auth';

type Props = {
    params: { id: string };
};

export async function PUT(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const cardId = params.id;
        const body = await request.json();
        const { name, description, image, rarity } = body;

        if (!name || !description || !image || !rarity) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const updatedCard = await prisma.card.update({
            where: { id: cardId },
            data: { name, description, image, rarity },
        });

        return NextResponse.json(updatedCard);
    } catch (error) {
        console.error('Failed to update card:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const cardId = params.id;

        await prisma.card.delete({
            where: { id: cardId },
        });

        return NextResponse.json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Failed to delete card:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
