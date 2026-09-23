import { cn } from '@/lib/cn';

import { AppText, type AppTextProps } from './app-text';

/** Small grey heading above a group of rows or cards. */
export function SectionLabel({ className, ...props }: Omit<AppTextProps, 'variant'>) {
  return (
    <AppText
      accessibilityRole="header"
      className={cn('mb-3 text-[13px] font-semibold text-muted', className)}
      {...props}
    />
  );
}
