import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const [leadCount, templateCount, jobs] = await Promise.all([
    prisma.lead.count({ where: { ownerUserId: session.user.id } }),
    prisma.template.count({ where: { ownerUserId: session.user.id } }),
    prisma.sendJob.findMany({
      where: { ownerUserId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  return (
    <AppShell isAdmin={session.user.role === 'admin'}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{leadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{templateCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last Send Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {jobs.length ? `${jobs[0].status} • ${jobs[0].countsSent} sent / ${jobs[0].countsFailed} failed` : 'No sends yet'}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Recent Sends</h2>
        <ul className="space-y-3 text-sm">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{job.channel.toUpperCase()} • {job.status}</p>
                  <p className="text-muted-foreground">Template: {job.templateId}</p>
                </div>
                <div className="text-right text-muted-foreground">
                  <p>Sent: {job.countsSent}</p>
                  <p>Failed: {job.countsFailed}</p>
                </div>
              </div>
            </li>
          ))}
          {!jobs.length && <li className="text-muted-foreground">No send history yet.</li>}
        </ul>
      </div>
    </AppShell>
  );
}
