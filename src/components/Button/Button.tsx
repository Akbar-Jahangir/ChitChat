import React from "react";
import { ButtonProps } from "./button.interface";

export const Button: React.FC<ButtonProps> = ({
  icon,
  iconClass,
  btnText,
  className,
  type = "button",
  onClick,
  disabled = false
}) => {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {icon && <div className={iconClass}>{icon}</div>}
      <p>{btnText}</p>
    </button>
  );
};
