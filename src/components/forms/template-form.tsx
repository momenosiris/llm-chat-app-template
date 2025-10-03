'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { templateSchema } from '@/schemas/templates';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const formSchema = templateSchema.extend({
  placeholdersInput: z.string().optional().default('')
});

type FormValues = z.infer<typeof formSchema>;

export function TemplateForm({ onSaved }: { onSaved?: () => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channel: 'email',
      placeholdersInput: ''
    }
  });
  const [error, setError] = useState<string | null>(null);

  const channel = form.watch('channel');

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          const res = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: values.name,
              channel: values.channel,
              htmlBody: values.htmlBody,
              whatsappBody: values.whatsappBody,
              placeholders: values.placeholdersInput
                ? values.placeholdersInput.split(',').map((p) => p.trim()).filter(Boolean)
                : []
            })
          });
          if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? 'Failed to save template');
            return;
          }
          if (onSaved) {
            onSaved();
          } else {
            window.location.reload();
          }
        } catch (error) {
          setError('Failed to save template');
        }
      })}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input {...form.register('name')} />
        </div>
        <div>
          <label className="text-sm font-medium">Channel</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...form.register('channel')}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>
      {channel === 'email' ? (
        <div>
          <label className="text-sm font-medium">HTML Body</label>
          <Textarea {...form.register('htmlBody')} rows={8} placeholder="<html>...</html>" />
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium">WhatsApp Body</label>
          <Textarea {...form.register('whatsappBody')} rows={6} placeholder="Hi {{first_name}}" />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Placeholders (comma separated)</label>
        <Input {...form.register('placeholdersInput')} placeholder="{{first_name}},{{unsubscribe_url}}" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Save Template</Button>
    </form>
  );
}
