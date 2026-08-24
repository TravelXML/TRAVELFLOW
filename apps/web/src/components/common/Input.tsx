import { InputHTMLAttributes, forwardRef, LabelHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ className, label, error, id, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={clsx(
        "rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
        error && "border-red-400 focus:border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
));
Input.displayName = "Input";

export function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="text-sm font-medium text-slate-700" {...props} />;
}
