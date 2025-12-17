import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Photo from '@/models/Photo';
import { requireAdmin } from '@/lib/middleware';

export async function DELETE(request, { params }) {
    const auth = await requireAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        await connectDB();
        const { id } = params;
        const photo = await Photo.findByIdAndDelete(id);

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const auth = await requireAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        const updateData = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.url !== undefined) updateData.url = body.url;
        if (body.isPaid !== undefined) updateData.isPaid = body.isPaid;
        if (body.price !== undefined) updateData.price = body.price;

        const photo = await Photo.findByIdAndUpdate(id, updateData, { new: true });

        if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

        return NextResponse.json({ success: true, photo });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
    }
}
