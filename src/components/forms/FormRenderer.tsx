'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { buildZodSchema, type FormFieldBlock } from '@/lib/forms/schema';
import { submitForm } from '@/lib/forms/submit-action';

interface FormRendererProps {
  formId: number;
  fields: FormFieldBlock[];
  confirmationMessage?: string;
  submitLabel?: string;
}

export function FormRenderer({
  formId,
  fields,
  confirmationMessage,
  submitLabel,
}: FormRendererProps) {
  const schema = buildZodSchema(fields);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [serverMessage, setServerMessage] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitForm(formId, values);
      if (result.ok) {
        setStatus('ok');
        setServerMessage(result.message ?? confirmationMessage ?? 'Message envoyé.');
      } else {
        setStatus('error');
        setServerMessage(result.message ?? 'Une erreur est survenue.');
        if (result.fieldErrors) {
          for (const [name, message] of Object.entries(result.fieldErrors)) {
            setError(name, { type: 'server', message });
          }
        }
      }
    });
  });

  if (status === 'ok') {
    return (
      <div className="rounded-lg border border-brand-secondary/40 bg-brand-secondary/10 p-6 text-brand-primary">
        {serverMessage}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {fields.map((field) => {
        if (field.blockType === 'message') return null;
        const errorMsg = errors[field.name]?.message;
        const id = `field-${field.name}`;
        return (
          <div key={field.name} className="space-y-2">
            {field.blockType !== 'checkbox' ? (
              <label htmlFor={id} className="block font-medium text-brand-primary text-sm">
                {field.label ?? field.name}
                {field.required ? <span className="ml-1 text-brand-accent">*</span> : null}
              </label>
            ) : null}
            {renderField(field, id, register)}
            {errorMsg ? (
              <p className="text-brand-accent text-sm" role="alert">
                {String(errorMsg)}
              </p>
            ) : null}
          </div>
        );
      })}
      {status === 'error' && serverMessage ? (
        <p className="rounded border border-brand-accent/40 bg-brand-accent/10 px-3 py-2 text-brand-accent text-sm">
          {serverMessage}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Envoi…' : (submitLabel ?? 'Envoyer')}
      </Button>
    </form>
  );
}

function renderField(
  field: FormFieldBlock,
  id: string,
  register: ReturnType<typeof useForm>['register'],
) {
  const className = cn(
    'w-full rounded-md border border-border bg-background px-3 py-2 text-brand-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
  );

  if (field.blockType === 'message') return null;

  if (field.blockType === 'textarea') {
    return <textarea id={id} {...register(field.name)} rows={6} className={className} />;
  }
  if (field.blockType === 'checkbox') {
    return (
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" id={id} {...register(field.name)} className="mt-0.5" />
        <span>
          {field.label ?? field.name}
          {field.required ? <span className="ml-1 text-brand-accent">*</span> : null}
        </span>
      </label>
    );
  }
  if (field.blockType === 'select') {
    return (
      <select id={id} {...register(field.name)} className={className}>
        <option value="">—</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.blockType === 'email') {
    return (
      <input
        id={id}
        type="email"
        autoComplete="email"
        {...register(field.name)}
        className={className}
      />
    );
  }
  if (field.blockType === 'number') {
    return <input id={id} type="number" {...register(field.name)} className={className} />;
  }
  return <input id={id} type="text" {...register(field.name)} className={className} />;
}
