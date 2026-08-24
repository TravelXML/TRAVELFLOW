import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(({ className, label, error, id, children, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    <select
      ref={ref}
      id={id}
      className={clsx(
        "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
        error && "border-red-400 focus:border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
));
Select.displayName = "Select";
