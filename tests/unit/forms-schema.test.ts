import { describe, expect, it } from 'vitest';
import { buildZodSchema, type FormFieldBlock } from '../../src/lib/forms/schema';

describe('buildZodSchema', () => {
  it('validates required text', () => {
    const schema = buildZodSchema([
      { blockType: 'text', name: 'name', required: true } as FormFieldBlock,
    ]);
    expect(schema.safeParse({ name: '' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Alice' }).success).toBe(true);
  });

  it('validates email', () => {
    const schema = buildZodSchema([
      { blockType: 'email', name: 'email', required: true } as FormFieldBlock,
    ]);
    expect(schema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('defaults unrequired checkbox to false', () => {
    const schema = buildZodSchema([
      { blockType: 'checkbox', name: 'opt', required: false } as FormFieldBlock,
    ]);
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opt).toBe(false);
  });

  it('required checkbox must be true', () => {
    const schema = buildZodSchema([
      {
        blockType: 'checkbox',
        name: 'accept',
        required: true,
      } as FormFieldBlock,
    ]);
    expect(schema.safeParse({ accept: false }).success).toBe(false);
    expect(schema.safeParse({ accept: true }).success).toBe(true);
  });

  it('skips message blocks', () => {
    const schema = buildZodSchema([
      { blockType: 'message', message: null } as FormFieldBlock,
      { blockType: 'text', name: 'subject', required: true } as FormFieldBlock,
    ]);
    expect(schema.safeParse({ subject: 'hi' }).success).toBe(true);
  });
});
