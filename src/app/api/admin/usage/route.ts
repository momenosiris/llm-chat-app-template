import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET() {
  try {
    await requireAdmin();

    const perUser = await prisma.user.findMany({
      include: {
        usageMeter: true,
        client: true
      }
    });

    const perClient = await prisma.client.findMany({
      include: {
        users: {
          include: {
            usageMeter: true
          }
        },
        sendJobs: true
      }
    });

    return NextResponse.json({ perUser, perClient });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 });
  }
}
