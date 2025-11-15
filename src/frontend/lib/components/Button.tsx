import Link from 'next/link';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  asChild?: boolean;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  asChild = false,
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#7297c5] text-white hover:bg-[#5a7ba3] focus:ring-[#7297c5]',
secondary: 'bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-all duration-200 ease-out focus:ring-black',
    outline: 'border-2 border-[#7297c5] text-[#7297c5] bg-white hover:bg-[#7297c5] hover:text-white focus:ring-[#7297c5]',
    ghost: 'text-black hover:bg-gray-100 focus:ring-gray-200',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }
  
  if (asChild) {
    return <span className={combinedClassName}>{children}</span>;
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={combinedClassName}>
      {children}
    </button>
  );
};

export default Button;
