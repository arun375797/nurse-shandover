import type { ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthShellProps {
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-teal-50/40">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="card-elevated p-6 sm:p-8">
          <div className="mb-8 flex flex-col items-center border-b border-slate-100 pb-8 text-center">
            <Logo size="lg" className="justify-center" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 sm:text-base">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </main>
      {footer ? (
        <footer className="px-4 py-6 text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
