import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { systemConfigSchema } from '@/schemas/admin';

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    return NextResponse.json({ config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = systemConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      create: parsed.data,
      update: parsed.data
    });
    return NextResponse.json({ config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
