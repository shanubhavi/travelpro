import React from "react";
import { getInitials } from "@/utils/helpers";

const Avatar = ({ name, src, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const baseClasses = `inline-flex items-center justify-center rounded-full bg-indigo-600 text-white font-medium ${sizeClasses[size]} ${className}`;

  if (src) {
    return (
      <img className={`${baseClasses} object-cover`} src={src} alt={name} />
    );
  }

  return <div className={baseClasses}>{getInitials(name)}</div>;
};

export default Avatar;
