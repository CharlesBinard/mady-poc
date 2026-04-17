import { formatCss, oklch, parse } from 'culori';

export function hexToOklch(hex: string): string {
  const parsed = parse(hex);
  if (!parsed) throw new Error(`Cannot parse color: ${hex}`);
  const converted = oklch(parsed);
  if (!converted) throw new Error(`Cannot convert to OKLCH: ${hex}`);
  return formatCss(converted);
}

export function hexToOklchTuple(hex: string): {
  l: number;
  c: number;
  h: number;
} {
  const parsed = parse(hex);
  if (!parsed) throw new Error(`Cannot parse color: ${hex}`);
  const converted = oklch(parsed);
  if (!converted) throw new Error(`Cannot convert to OKLCH: ${hex}`);
  return {
    l: Math.round((converted.l ?? 0) * 1000) / 1000,
    c: Math.round((converted.c ?? 0) * 1000) / 1000,
    h: Math.round((converted.h ?? 0) * 10) / 10,
  };
}
