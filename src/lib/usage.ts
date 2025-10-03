import { prisma } from './prisma';

export async function incrementUsage(userId: string, data: Partial<{ totalLeads: number; totalSendsEmail: number; totalSendsWhatsapp: number; totalFailures: number }>) {
  await prisma.usageMeter.upsert({
    where: { userId },
    update: {
      totalLeads: { increment: data.totalLeads ?? 0 },
      totalSendsEmail: { increment: data.totalSendsEmail ?? 0 },
      totalSendsWhatsapp: { increment: data.totalSendsWhatsapp ?? 0 },
      totalFailures: { increment: data.totalFailures ?? 0 }
    },
    create: {
      userId,
      totalLeads: data.totalLeads ?? 0,
      totalSendsEmail: data.totalSendsEmail ?? 0,
      totalSendsWhatsapp: data.totalSendsWhatsapp ?? 0,
      totalFailures: data.totalFailures ?? 0,
      window30d: {},
      window90d: {}
    }
  });
}
