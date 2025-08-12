import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/auth';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Basic validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.' }, { status: 400 });
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'cards');
        const filePath = path.join(uploadDir, filename);

        // Ensure the directory exists
        // Note: In a real app, you might want to create this directory on app startup
        // or use a more robust file system utility.
        // For this prototype, we assume 'public/images/cards' exists or is created manually.

        await writeFile(filePath, buffer);

        const imageUrl = `/images/cards/${filename}`;
        return NextResponse.json({ imageUrl });

    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
