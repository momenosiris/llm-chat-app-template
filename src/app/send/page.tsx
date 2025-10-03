import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SendWizard } from '@/components/forms/send-wizard';

export default async function SendPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppShell isAdmin={session.user.role === 'admin'}>
      <Card>
        <CardHeader>
          <CardTitle>Send Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <SendWizard />
        </CardContent>
      </Card>
    </AppShell>
  );
}
