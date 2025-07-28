import React from "react";
import { MapPin } from "lucide-react";

const LoadingSpinner = ({ size = "default", text = "Loading..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-primary-600 animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 text-sm">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
