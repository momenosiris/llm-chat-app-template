'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { sendJobSchema } from '@/schemas/send';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = sendJobSchema;

type FormValues = z.infer<typeof formSchema>;

export function SendWizard() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { channel: 'email', segmentTags: [], filters: { optedInOnly: true }, logic: 'or' }
  });

  const [tags, setTags] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channel = form.watch('channel');

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => setTags(data.tags ?? []));
  }, []);

  useEffect(() => {
    fetch(`/api/templates?channel=${channel}`)
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates ?? []));
  }, [channel]);

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setMessage(null);
        setError(null);
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Failed to create send job');
          return;
        }
        setMessage('Send job queued successfully.');
      })}
    >
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="text-sm font-medium">Logic</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...form.register('logic')}
          >
            <option value="or">Tags OR</option>
            <option value="and">Tags AND</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Template</label>
        <select
          className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...form.register('templateId')}
        >
          <option value="">Select template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = (form.getValues('segmentTags') ?? []).includes(tag);
            return (
              <button
                type="button"
                key={tag}
                className={`rounded-full border px-3 py-1 text-sm ${selected ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => {
                  const current = new Set(form.getValues('segmentTags') ?? []);
                  if (current.has(tag)) {
                    current.delete(tag);
                  } else {
                    current.add(tag);
                  }
                  form.setValue('segmentTags', Array.from(current));
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked {...form.register('filters.optedInOnly')} /> Opted-in only
        </label>
      </div>
      <div>
        <label className="text-sm font-medium">Webhook Flow ID (optional)</label>
        <Input {...form.register('webhookFlowId')} placeholder="leave blank for default" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <Button type="submit">Confirm &amp; Send</Button>
    </form>
  );
}
