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
        const oripas = await prisma.oripa.findMany({
            include: {
                cards: {
                    include: { card: true },
                },
            },
        });
        return NextResponse.json(oripas);
    } catch (error) {
        console.error('Failed to fetch oripas:', error);
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
        const { name, description, price, cardIds } = body;

        if (!name || !description || !price || !cardIds || !Array.isArray(cardIds)) {
            return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
        }

        const newOripa = await prisma.oripa.create({
            data: {
                name,
                description,
                price,
                cards: {
                    create: cardIds.map((cardId: string) => ({
                        card: { connect: { id: cardId } },
                    })),
                },
            },
        });

        return NextResponse.json(newOripa, { status: 201 });
    } catch (error) {
        console.error('Failed to create oripa:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
