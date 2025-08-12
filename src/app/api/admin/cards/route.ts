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
        const cards = await prisma.card.findMany();
        return NextResponse.json(cards);
    } catch (error) {
        console.error('Failed to fetch cards:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, image, rarity } = body;

        if (!name || !description || !image || !rarity) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const newCard = await prisma.card.create({
            data: { name, description, image, rarity },
        });

        return NextResponse.json(newCard, { status: 201 });
    } catch (error) {
        console.error('Failed to create card:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
