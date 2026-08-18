import type React from "react";
import { Link } from "react-router-dom";

interface DropdownItemProps {
  tag?: "a" | "button" | "div";
  to?: string;
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "div",
  to,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  children,
}) => {
  const combinedClasses = `${baseClassName} ${className}`.trim();

  const handleClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (onClick) onClick(event);
    if (onItemClick) onItemClick();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  if (tag === "a" && to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  if (tag === "button") {
    return (
      <button type="button" onClick={handleClick} className={combinedClasses}>
        {children}
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={combinedClasses}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
};
