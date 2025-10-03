import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { clientSchema } from '@/schemas/admin';

export async function GET() {
  try {
    await requireAdmin();
    const clients = await prisma.client.findMany({
      include: { webhooks: true, users: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ clients });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: parsed.data
    });
    return NextResponse.json({ client });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = clientSchema.partial().safeParse(body);
    if (!parsed.success || !('id' in body)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updated = await prisma.client.update({
      where: { id: body.id },
      data: parsed.data
    });
    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    const client = await prisma.client.findUnique({
      where: { id },
      include: { users: true, sendJobs: true }
    });
    if (!client) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (client.users.length > 0 || client.sendJobs.length > 0) {
      return NextResponse.json({ error: 'Client has associations; reassign first' }, { status: 400 });
    }
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
