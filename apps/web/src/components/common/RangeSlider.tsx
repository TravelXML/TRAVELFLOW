import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  valueLabel: string;
}

export const RangeSlider = forwardRef<HTMLInputElement, Props>(({ label, valueLabel, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-sm">
      <label className="font-medium text-slate-700">{label}</label>
      <span className="text-slate-500">{valueLabel}</span>
    </div>
    <input ref={ref} type="range" className="accent-brand" {...props} />
  </div>
));
RangeSlider.displayName = "RangeSlider";
