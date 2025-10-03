import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { clientWebhookSchema } from '@/schemas/admin';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const webhooks = await prisma.clientWebhook.findMany({
      where: clientId ? { clientId } : {},
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load webhooks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = clientWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.isDefault) {
      await prisma.clientWebhook.updateMany({
        where: { clientId: parsed.data.clientId, channel: parsed.data.channel },
        data: { isDefault: false }
      });
    }

    const webhook = await prisma.clientWebhook.create({
      data: parsed.data
    });
    return NextResponse.json({ webhook });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = clientWebhookSchema.partial().safeParse(body);
    if (!parsed.success || !('id' in body)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    if (body.isDefault) {
      await prisma.clientWebhook.updateMany({
        where: { clientId: body.clientId, channel: body.channel },
        data: { isDefault: false }
      });
    }

    const webhook = await prisma.clientWebhook.update({
      where: { id: body.id },
      data: parsed.data
    });
    return NextResponse.json({ webhook });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    const webhook = await prisma.clientWebhook.findUnique({
      where: { id },
      include: { client: { include: { users: true } } }
    });
    if (!webhook) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.clientWebhook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
