'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { leadSchema } from '@/schemas/leads';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const formSchema = leadSchema.extend({
  tagsInput: z.string().optional().default(''),
  customFieldsRaw: z.string().optional().default('')
});

type FormValues = z.infer<typeof formSchema>;

export function LeadForm({ onCreated }: { onCreated?: () => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tagsInput: '',
      customFieldsRaw: ''
    }
  });
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: values.email,
              whatsappNumber: values.whatsappNumber,
              firstName: values.firstName,
              lastName: values.lastName,
              tags: values.tagsInput
                ? values.tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean)
                : [],
              customFields: values.customFieldsRaw ? JSON.parse(values.customFieldsRaw) : {},
              optedIn: true
            })
          });
          if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? 'Failed to create lead');
            return;
          }
          form.reset();
          if (onCreated) {
            onCreated();
          } else {
            window.location.reload();
          }
        } catch (err) {
          setError('Failed to create lead');
        }
      })}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="name@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp Number</label>
          <Input {...form.register('whatsappNumber')} placeholder="+12025550123" />
        </div>
        <div>
          <label className="text-sm font-medium">First Name</label>
          <Input {...form.register('firstName')} />
        </div>
        <div>
          <label className="text-sm font-medium">Last Name</label>
          <Input {...form.register('lastName')} />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <Input {...form.register('tagsInput')} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Custom Fields (JSON)</label>
        <Textarea {...form.register('customFieldsRaw')} rows={4} placeholder='{"company":"Acme"}' />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Save Lead</Button>
    </form>
  );
}
