import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function UsagePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [users, clients] = await Promise.all([
    prisma.user.findMany({ include: { usageMeter: true, client: true } }),
    prisma.client.findMany({ include: { users: { include: { usageMeter: true } } } })
  ]);

  return (
    <AppShell isAdmin>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Per User Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Email Sends</TableHead>
                  <TableHead>WhatsApp Sends</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.usageMeter?.totalLeads ?? 0}</TableCell>
                    <TableCell>{user.usageMeter?.totalSendsEmail ?? 0}</TableCell>
                    <TableCell>{user.usageMeter?.totalSendsWhatsapp ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Per Client Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Total Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const totals = client.users.reduce(
                    (acc, user) => {
                      acc.leads += user.usageMeter?.totalLeads ?? 0;
                      acc.email += user.usageMeter?.totalSendsEmail ?? 0;
                      acc.whatsapp += user.usageMeter?.totalSendsWhatsapp ?? 0;
                      return acc;
                    },
                    { leads: 0, email: 0, whatsapp: 0 }
                  );
                  return (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.users.length}</TableCell>
                      <TableCell>{totals.leads}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
