import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className={cn('text-muted text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.href ?? 'nohref'}-${item.label}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-brand-primary">
                  {item.label}
                </Link>
              ) : (
                <span className="text-brand-primary" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronRight aria-hidden="true" className="h-4 w-4 text-border" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
