import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { sendJobSchema } from '@/schemas/send';
import { signPayload } from '@/lib/hmac';

async function buildTargets(leads: any[]) {
  return leads.map((lead) => ({
    lead_id: lead.id,
    email: lead.email ?? undefined,
    whatsapp_number: lead.whatsappNumber ?? undefined,
    merge: {
      first_name: lead.firstName ?? '',
      last_name: lead.lastName ?? '',
      custom_fields: lead.customFields ?? {}
    }
  }));
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = sendJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    const template = await prisma.template.findFirst({
      where: { id: data.templateId, ownerUserId: user.id }
    });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const owner = await prisma.user.findUnique({
      where: { id: user.id },
      include: { client: { include: { webhooks: true } } }
    });

    if (!owner?.client) {
      return NextResponse.json({ error: 'User has no client' }, { status: 400 });
    }

    const logic = data.logic ?? 'or';
    const tags = data.segmentTags ?? [];

    const leads = await prisma.lead.findMany({
      where: {
        ownerUserId: user.id,
        ...(tags.length
          ? logic === 'and'
            ? { tags: { hasEvery: tags } }
            : { tags: { hasSome: tags } }
          : {}),
        ...(data.filters?.optedInOnly ? { optedIn: true } : {}),
        ...(data.channel === 'email' ? { email: { not: null } } : {}),
        ...(data.channel === 'whatsapp' ? { whatsappNumber: { not: null } } : {})
      }
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads found for selection' }, { status: 400 });
    }

    const flow = data.webhookFlowId
      ? owner.client.webhooks.find((w) => w.id === data.webhookFlowId)
      : owner.client.webhooks.find((w) => w.channel === data.channel && w.isDefault);

    if (!flow) {
      return NextResponse.json({ error: 'Webhook flow not configured' }, { status: 400 });
    }

    const job = await prisma.sendJob.create({
      data: {
        ownerUserId: user.id,
        clientId: owner.clientId!,
        channel: template.channel,
        templateId: template.id,
        segmentTags: tags,
        filters: data.filters ?? {},
        webhookFlowId: flow.id,
        webhookFlowName: flow.name,
        countsTotalTargets: leads.length,
        events: {
          create: leads.map((lead) => ({
            leadId: lead.id
          }))
        }
      },
      include: {
        events: true
      }
    });

    const targets = await buildTargets(leads);
    const systemConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } });

    const payload = {
      type: template.channel === 'email' ? 'EMAIL_BLAST' : 'WHATSAPP_BLAST',
      client_id: owner.clientId,
      job_id: job.id,
      user_id: user.id,
      webhook_flow: { id: flow.id, name: flow.name },
      template:
        template.channel === 'email'
          ? {
              id: template.id,
              html_body: template.htmlBody,
              placeholders: template.placeholders
            }
          : {
              id: template.id,
              whatsapp_body: template.whatsappBody,
              placeholders: template.placeholders
            },
      targets: targets.map((target) => ({
        lead_id: target.lead_id,
        email: target.email,
        whatsapp_number: target.whatsapp_number,
        merge: target.merge
      })),
      callback_url: systemConfig?.callbackWebhookIn ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/callback`
    };

    const bodyString = JSON.stringify(payload);
    const secret = owner.client.hmacSecret || systemConfig?.defaultHmacSecret || process.env.SYSTEM_DEFAULT_HMAC_SECRET || '';
    const signature = signPayload(bodyString, secret);

    await fetch(flow.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`
      },
      body: bodyString
    }).catch((error) => {
      console.error('Webhook error', error);
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send job' }, { status: 500 });
  }
}
