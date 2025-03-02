import { InputProps } from "./input.interface";

export const Input: React.FC<InputProps> = ({
  placeholder = "Name",
  type = "text",
  onChange,
  className,
  value,
  accept,
  capture,
  multiple,
}) => {
  return (
    <input
      className={className}
      placeholder={placeholder}
      type={type}
      onChange={onChange}
      value={value}
      accept={accept}
      capture={capture}
      multiple={multiple}
    />
  );
};