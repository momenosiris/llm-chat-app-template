import { AuthOptions, DefaultSession, getServerSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export type AppSession = DefaultSession & {
  user?: {
    id: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled';
    clientId?: string | null;
  };
};

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            client: true
          }
        });

        if (!user || user.status === 'disabled') {
          throw new Error('Invalid credentials');
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error('Invalid credentials');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          clientId: user.clientId
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.clientId = (user as any).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...(session.user ?? {}),
          id: token.id as string,
          role: token.role as 'admin' | 'user',
          status: token.status as 'active' | 'disabled',
          clientId: (token.clientId as string | null) ?? undefined
        }
      } as AppSession;
    }
  }
};

export function requireActiveUser(session: AppSession | null) {
  if (!session || !session.user || session.user.status === 'disabled') {
    throw new Error('Unauthorized');
  }
}

export async function getSession() {
  return (await getServerSession(authOptions)) as AppSession;
}
