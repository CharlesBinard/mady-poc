import { z } from 'zod';

export type FormFieldBlock =
  | {
      blockType: 'text';
      name: string;
      label?: string | null;
      required?: boolean | null;
      width?: number | null;
    }
  | {
      blockType: 'email';
      name: string;
      label?: string | null;
      required?: boolean | null;
      width?: number | null;
    }
  | {
      blockType: 'textarea';
      name: string;
      label?: string | null;
      required?: boolean | null;
      width?: number | null;
    }
  | {
      blockType: 'number';
      name: string;
      label?: string | null;
      required?: boolean | null;
      width?: number | null;
    }
  | {
      blockType: 'checkbox';
      name: string;
      label?: string | null;
      required?: boolean | null;
      width?: number | null;
    }
  | {
      blockType: 'select';
      name: string;
      label?: string | null;
      required?: boolean | null;
      width?: number | null;
      options?: { label: string; value: string }[] | null;
    }
  | {
      blockType: 'message';
      message?: unknown;
    };

function fieldValidator(field: FormFieldBlock): z.ZodType {
  if (field.blockType === 'message') return z.unknown();
  const required = field.required ?? false;

  if (field.blockType === 'email') {
    const v = z.email('Email invalide');
    return required ? v : v.or(z.literal(''));
  }
  if (field.blockType === 'number') {
    const v = z.coerce.number({ message: 'Nombre invalide' });
    return required ? v : v.optional();
  }
  if (field.blockType === 'checkbox') {
    return required
      ? z.boolean().refine((v) => v === true, 'Ce champ est requis')
      : z.boolean().optional().default(false);
  }
  const str = z.string();
  return required ? str.min(1, 'Ce champ est requis') : str;
}

export function buildZodSchema(fields: FormFieldBlock[]): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    if (field.blockType === 'message') continue;
    shape[field.name] = fieldValidator(field);
  }
  return z.object(shape);
}
