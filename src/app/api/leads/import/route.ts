import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { parseCsv } from '@/lib/csv';
import { incrementUsage } from '@/lib/usage';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const buffer = Buffer.from(await request.arrayBuffer());
    const rows = await parseCsv(buffer);

    let created = 0;
    for (const row of rows) {
      const email = row.email?.trim();
      const whatsapp = row.whatsapp_number?.trim();
      if (!email && !whatsapp) continue;

      const tags = row.tags ? row.tags.split(/[,;]+/).map((t) => t.trim()).filter(Boolean) : [];
      const optedIn = row.opted_in ? row.opted_in.toLowerCase() !== 'false' : true;

      if (email) {
        await prisma.lead.upsert({
          where: {
            ownerUserId_email: {
              ownerUserId: user.id,
              email
            }
          },
          update: {
            whatsappNumber: whatsapp ?? undefined,
            firstName: row.first_name ?? undefined,
            lastName: row.last_name ?? undefined,
            tags,
            optedIn
          },
          create: {
            ownerUserId: user.id,
            email,
            whatsappNumber: whatsapp ?? undefined,
            firstName: row.first_name ?? undefined,
            lastName: row.last_name ?? undefined,
            tags,
            optedIn,
            customFields: {}
          }
        });
        created += 1;
        continue;
      }

      if (whatsapp) {
        await prisma.lead.upsert({
          where: {
            ownerUserId_whatsappNumber: {
              ownerUserId: user.id,
              whatsappNumber: whatsapp
            }
          },
          update: {
            firstName: row.first_name ?? undefined,
            lastName: row.last_name ?? undefined,
            tags,
            optedIn
          },
          create: {
            ownerUserId: user.id,
            whatsappNumber: whatsapp,
            firstName: row.first_name ?? undefined,
            lastName: row.last_name ?? undefined,
            tags,
            optedIn,
            customFields: {}
          }
        });
        created += 1;
      }
    }

    if (created > 0) {
      await incrementUsage(user.id, { totalLeads: created });
    }

    return NextResponse.json({ imported: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 });
  }
}
