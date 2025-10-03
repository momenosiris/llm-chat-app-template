import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignature } from '@/lib/hmac';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody) as {
      job_id: string;
      lead_id: string;
      status: 'sent' | 'failed' | 'queued';
      provider_message_id?: string | null;
      error_message?: string | null;
    };

    const job = await prisma.sendJob.findUnique({
      where: { id: payload.job_id },
      include: { client: true }
    });

    const systemConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const secret = job.client.hmacSecret || systemConfig?.defaultHmacSecret || process.env.SYSTEM_DEFAULT_HMAC_SECRET || '';
    const signature = request.headers.get('x-signature');

    if (!verifySignature(signature, rawBody, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    await prisma.sendEvent.updateMany({
      where: { sendJobId: payload.job_id, leadId: payload.lead_id },
      data: {
        status: payload.status,
        providerMessageId: payload.provider_message_id ?? null,
        errorMessage: payload.error_message ?? null
      }
    });

    const counts = await prisma.sendEvent.groupBy({
      by: ['status'],
      where: { sendJobId: payload.job_id },
      _count: { _all: true }
    });

    const sent = counts.find((c) => c.status === 'sent')?._count._all ?? 0;
    const failed = counts.find((c) => c.status === 'failed')?._count._all ?? 0;

    await prisma.sendJob.update({
      where: { id: payload.job_id },
      data: {
        countsSent: sent,
        countsFailed: failed,
        status:
          failed > 0 && sent > 0
            ? 'partial_success'
            : failed > 0 && sent === 0
            ? 'failed'
            : sent > 0
            ? 'completed'
            : 'processing'
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process callback' }, { status: 500 });
  }
}
