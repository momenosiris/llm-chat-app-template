import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { leadSchema } from '@/schemas/leads';
import { incrementUsage } from '@/lib/usage';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const tags = searchParams.getAll('tags');

    const leads = await prisma.lead.findMany({
      where: {
        ownerUserId: user.id,
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { whatsappNumber: { contains: q, mode: 'insensitive' } },
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } }
              ]
            }
          : {}),
        ...(tags.length
          ? {
              tags: {
                hasEvery: tags
              }
            }
          : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        ownerUserId: user.id,
        email: payload.email ?? undefined,
        whatsappNumber: payload.whatsappNumber ?? undefined,
        firstName: payload.firstName ?? undefined,
        lastName: payload.lastName ?? undefined,
        tags: payload.tags ?? [],
        optedIn: payload.optedIn ?? true,
        customFields: payload.customFields ?? {}
      }
    });

    await incrementUsage(user.id, { totalLeads: 1 });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
