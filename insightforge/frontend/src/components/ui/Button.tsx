import clsx from 'clsx';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-brand-600 hover:bg-brand-700',
        variant === 'secondary' && 'bg-slate-800 hover:bg-slate-700',
        variant === 'ghost' && 'hover:bg-slate-800',
        className,
      )}
      {...props}
    />
  );
}
