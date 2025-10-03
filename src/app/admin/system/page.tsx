import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SystemConfigPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });

  return (
    <AppShell isAdmin>
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Callback URL</p>
            <p className="text-sm text-muted-foreground">{config?.callbackWebhookIn}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Default HMAC Secret</p>
            <p className="text-sm text-muted-foreground">{config?.defaultHmacSecret}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Rate Limits</p>
            <pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(config?.rateLimits, null, 2)}</pre>
          </div>
          <div>
            <p className="text-sm font-medium">CSV Mapping</p>
            <pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(config?.csvDefaultMapping, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
