import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { userAdminSchema } from '@/schemas/admin';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = userAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: rest.name,
        email: rest.email,
        role: rest.role,
        status: rest.status ?? 'active',
        passwordHash,
        clientId: rest.clientId ?? null
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = userAdminSchema.extend({ id: userAdminSchema.shape.email.transform(() => '') }).partial().safeParse(body);
    if (!parsed.success || !('id' in body)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { id, password, ...rest } = body as any;
    const data: any = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    const user = await prisma.user.findUnique({ where: { id }, include: { leads: true, templates: true } });
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (user.leads.length > 0 || user.templates.length > 0) {
      return NextResponse.json({ error: 'User owns data; reassign before deleting' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
