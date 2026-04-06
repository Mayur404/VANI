"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[300px] bg-[#0f0e10] backdrop-blur-sm",
              toast.type === "success" && "border-l-4 border-l-green-500 border-[#1f1f1f]",
              toast.type === "error" && "border-l-4 border-l-red-500 border-[#1f1f1f]",
              toast.type === "info" && "border-l-4 border-l-blue-500 border-[#1f1f1f]"
            )}
          >
            {toast.type === "success" && <CheckCircle size={20} className="text-green-500" />}
            {toast.type === "error" && <AlertCircle size={20} className="text-red-500" />}
            {toast.type === "info" && <AlertCircle size={20} className="text-blue-500" />}
            <span className="text-white text-sm font-lexend flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#9d9d9d] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
