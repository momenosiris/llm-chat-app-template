import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { templateSchema } from '@/schemas/templates';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    const templates = await prisma.template.findMany({
      where: {
        ownerUserId: user.id,
        ...(channel ? { channel: channel as any } : {})
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const template = await prisma.template.create({
      data: {
        ownerUserId: user.id,
        name: data.name,
        channel: data.channel,
        htmlBody: data.htmlBody ?? null,
        whatsappBody: data.whatsappBody ?? null,
        placeholders: data.placeholders ?? []
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
