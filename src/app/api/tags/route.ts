import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireUser();
    const tags = await prisma.lead.findMany({
      where: { ownerUserId: user.id },
      select: { tags: true }
    });
    const unique = Array.from(new Set(tags.flatMap((t) => t.tags)));
    return NextResponse.json({ tags: unique });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { leadIds, tags }: { leadIds: string[]; tags: string[] } = await request.json();
    await prisma.lead.updateMany({
      where: { ownerUserId: user.id, id: { in: leadIds } },
      data: {
        tags
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}
