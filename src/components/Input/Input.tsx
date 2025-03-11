import { forwardRef } from "react";
import { InputProps } from "./input.interface";

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  placeholder,
  type = "text",
  onChange,
  className,
  value,
  accept,
  disabled=false
}, ref) => {
  return (
    <input
    ref={ref}
      className={className}
      placeholder={placeholder}
      type={type}
      onChange={onChange}
      value={value}
      accept={accept}
      disabled={disabled}
    />
  );
})