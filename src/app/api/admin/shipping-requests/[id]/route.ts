import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
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
        const requestId = params.id;
        const body = await request.json();
        const { status, shippedDate, trackingNumber } = body;

        const updatedRequest = await prisma.shippingRequest.update({
            where: { id: requestId },
            data: {
                status: status,
                shippedDate: shippedDate ? new Date(shippedDate) : null,
                trackingNumber: trackingNumber || null,
            },
        });

        // If status is SHIPPED or DELIVERED, ensure userCards are marked as shipped
        if (status === "SHIPPED" || status === "DELIVERED") {
            await prisma.userCard.updateMany({
                where: { shippingRequestId: requestId },
                data: { isShipped: true },
            });
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Failed to update shipping request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const requestId = params.id;

        // Disassociate UserCards from this shipping request before deleting
        await prisma.userCard.updateMany({
            where: { shippingRequestId: requestId },
            data: { shippingRequestId: null, isShipped: false }, // Revert to not shipped
        });

        await prisma.shippingRequest.delete({
            where: { id: requestId },
        });

        return NextResponse.json({ message: 'Shipping request deleted successfully' });
    } catch (error) {
        console.error('Failed to delete shipping request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
