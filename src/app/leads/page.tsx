import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { LeadForm } from '@/components/forms/lead-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function LeadsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const leads = await prisma.lead.findMany({ where: { ownerUserId: session.user.id }, orderBy: { createdAt: 'desc' } });

  return (
    <AppShell isAdmin={session.user.role === 'admin'}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.whatsappNumber}</TableCell>
                    <TableCell>{lead.tags.join(', ')}</TableCell>
                  </TableRow>
                ))}
                {!leads.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No leads yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
