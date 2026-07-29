type LogoVariant = 'light' | 'dark';
type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const sizeStyles: Record<LogoSize, { icon: string; text: string; gap: string }> = {
  sm: { icon: 'h-7 w-7', text: 'text-lg', gap: 'gap-2' },
  md: { icon: 'h-9 w-9', text: 'text-2xl', gap: 'gap-2.5' },
  lg: { icon: 'h-12 w-12', text: 'text-3xl sm:text-[2rem]', gap: 'gap-3' },
};

export function Logo({ variant = 'light', size = 'md', className = '' }: LogoProps) {
  const styles = sizeStyles[size];
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center ${styles.gap} ${className}`}>
      <img
        src="/logo-icon.png"
        alt=""
        className={`${styles.icon} shrink-0 object-contain`}
        aria-hidden="true"
      />
      <span className={`font-display ${styles.text} font-bold leading-none tracking-tight`}>
        <span className={isDark ? 'text-white' : 'text-navy-900'}>Nurse&apos;s </span>
        <span className={isDark ? 'text-teal-400' : 'text-teal-600'}>Handover</span>
      </span>
    </div>
  );
}
