import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { templateSchema } from '@/schemas/templates';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const template = await prisma.template.findFirst({
      where: { id: params.id, ownerUserId: user.id }
    });
    if (!template) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = templateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const template = await prisma.template.updateMany({
      where: { id: params.id, ownerUserId: user.id },
      data: parsed.data
    });

    if (template.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.template.findUnique({ where: { id: params.id } });
    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const template = await prisma.template.deleteMany({
      where: { id: params.id, ownerUserId: user.id }
    });
    if (template.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
