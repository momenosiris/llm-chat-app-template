import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [users, clients] = await Promise.all([
    prisma.user.findMany({ include: { client: true } }),
    prisma.client.findMany({})
  ]);

  return (
    <AppShell isAdmin>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={async (formData) => {
                'use server';
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;
                const role = formData.get('role') as 'admin' | 'user';
                const clientId = formData.get('clientId') as string | null;
                await prisma.user.create({
                  data: {
                    name,
                    email,
                    role,
                    status: 'active',
                    passwordHash: await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.hash(password, 10)),
                    clientId: clientId || null
                  }
                });
              }}
            >
              <div>
                <label className="text-sm font-medium">Name</label>
                <input name="name" required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <input name="password" type="password" required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select name="role" className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Client</label>
                <select name="clientId" className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                Create User
              </button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.client?.name ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
