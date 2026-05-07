import { clsx } from 'clsx';

const variants = {
  default: 'bg-white border border-gray-100 shadow-sm',
  wallet: 'bg-white border border-blue-100 shadow-sm',
  walletHero: 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white border border-blue-900 shadow-lg',
  softDanger: 'bg-red-50 border border-red-100 shadow-sm',
};

export default function Card({
  children,
  className,
  padding = 'md',
  variant = 'default',
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('border-b border-gray-100 pb-4 mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}