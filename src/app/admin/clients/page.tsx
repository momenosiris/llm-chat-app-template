import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function AdminClientsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const clients = await prisma.client.findMany({ include: { webhooks: true } });

  return (
    <AppShell isAdmin>
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default HMAC</TableHead>
                <TableHead>Webhooks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.status}</TableCell>
                  <TableCell className="font-mono text-xs">{client.hmacSecret.slice(0, 6)}•••</TableCell>
                  <TableCell>{client.webhooks.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
