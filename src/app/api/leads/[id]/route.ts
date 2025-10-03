import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { leadSchema } from '@/schemas/leads';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const lead = await prisma.lead.findFirst({
      where: { id: params.id, ownerUserId: user.id }
    });
    if (!lead) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = leadSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const lead = await prisma.lead.updateMany({
      where: { id: params.id, ownerUserId: user.id },
      data: parsed.data
    });

    if (lead.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.lead.findUnique({ where: { id: params.id } });
    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const lead = await prisma.lead.deleteMany({
      where: { id: params.id, ownerUserId: user.id }
    });
    if (lead.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
