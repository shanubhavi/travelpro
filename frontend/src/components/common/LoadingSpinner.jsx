import React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/utils/helpers";

const LoadingSpinner = ({
  size = "default",
  text = "Loading...",
  className = "",
  fullScreen = true,
  variant = "default",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const variants = {
    default: "text-primary-600",
    light: "text-white",
    dark: "text-gray-900",
  };

  const SpinnerIcon = variant === "brand" ? MapPin : Loader2;

  if (fullScreen) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center min-h-screen bg-gray-50",
          className
        )}
      >
        <div className="relative mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-primary-600 animate-pulse" />
          </div>
        </div>
        {text && (
          <p className="text-gray-600 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <div className="flex flex-col items-center space-y-2">
        <SpinnerIcon
          className={cn("animate-spin", sizeClasses[size], variants[variant])}
        />
        {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
