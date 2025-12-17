/**
 * FeatherIcon Component
 *
 * A flexible, reusable component for rendering Feather icons.
 * Icons are loaded from the feather-icons.ts file which contains SVG path data.
 *
 * Usage:
 *   <FeatherIcon name="edit-3" />
 *   <FeatherIcon name="download-cloud" className="h-4 w-4" />
 *   <FeatherIcon name="search" size="lg" />
 */

import { featherIcons, type FeatherIconName } from "./feather-icons";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface FeatherIconProps {
  /** Name of the Feather icon to render */
  name: FeatherIconName;
  /** Optional additional CSS classes */
  className?: string;
  /** Predefined size option (default: "sm") */
  size?: IconSize;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
  /** aria-label for accessibility (icon is hidden from screen readers if not provided) */
  ariaLabel?: string;
}

const sizeClasses: Record<IconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export default function FeatherIcon({
  name,
  className = "",
  size = "sm",
  strokeWidth = 2,
  ariaLabel,
}: FeatherIconProps) {
  const paths = featherIcons[name];

  if (!paths) {
    console.warn(`FeatherIcon: Unknown icon name "${name}"`);
    return null;
  }

  const sizeClass = sizeClasses[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {paths.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
