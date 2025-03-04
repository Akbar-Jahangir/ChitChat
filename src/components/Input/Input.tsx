import { InputProps } from "./input.interface";

export const Input: React.FC<InputProps> = ({
  placeholder = "Name",
  type = "text",
  onChange,
  className,
  value,
  accept,
}) => {
  return (
    <input
      className={className}
      placeholder={placeholder}
      type={type}
      onChange={onChange}
      value={value}
      accept={accept}
    />
  );
};