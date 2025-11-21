interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable heading component with consistent dark theme styling
 * Provides high-contrast text colors for better readability
 */
export default function Heading({
  level = 1,
  children,
  className = "",
}: HeadingProps) {
  const baseStyles = "font-bold text-dark-text";

  const sizeStyles = {
    1: "text-4xl md:text-5xl",
    2: "text-3xl md:text-4xl",
    3: "text-2xl md:text-3xl",
    4: "text-xl md:text-2xl",
    5: "text-lg md:text-xl",
    6: "text-base md:text-lg",
  };

  const combinedClassName = `${baseStyles} ${sizeStyles[level]} ${className}`;

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return <Tag className={combinedClassName}>{children}</Tag>;
}
