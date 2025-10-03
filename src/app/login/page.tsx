'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    if (res?.error) {
      setError(res.error);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-xl font-semibold">Login</h1>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
