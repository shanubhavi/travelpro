import React, { useState, useEffect } from "react";
import { X, Bell, CheckCircle, AlertCircle, Info } from "lucide-react";

const Notification = ({ type, title, message, onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose && onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          text: "text-green-800",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          icon: <AlertCircle className="h-5 w-5 text-red-400" />,
          text: "text-red-800",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
          text: "text-yellow-800",
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: <Info className="h-5 w-5 text-blue-400" />,
          text: "text-blue-800",
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div
      className={`rounded-lg border p-4 ${styles.bg} ${styles.text} animate-slide-up`}
    >
      <div className="flex">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <p className={`text-sm ${title ? "mt-1" : ""}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => {
              setIsVisible(false);
              onClose && onClose();
            }}
            className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
