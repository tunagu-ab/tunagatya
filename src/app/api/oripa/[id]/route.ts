import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Props = {
    params: { id: string };
};

export async function GET(request: Request, { params }: Props) {
    try {
        const oripa = await prisma.oripa.findUnique({
            where: { id: params.id },
            include: { cards: { include: { card: true } } },
        });

        if (!oripa) {
            return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
        }

        return NextResponse.json({ oripa });

    } catch (error) {
        console.error('Failed to fetch oripa:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
