import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function ActivityPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const jobs = await prisma.sendJob.findMany({
    where: { ownerUserId: session.user.id },
    include: { events: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <AppShell isAdmin={session.user.role === 'admin'}>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.channel}</TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>{job.countsSent}</TableCell>
                  <TableCell>{job.countsFailed}</TableCell>
                  <TableCell>{job.createdAt.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!jobs.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
