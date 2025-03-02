import React from "react";
import { ButtonProps } from "./button.interface";

export const Button: React.FC<ButtonProps> = ({
  icon,
  iconClass,
  btnText,
  className,
  type = "button",
  onClick
}) => {
  return (
    <button type={type} className={className} onClick={onClick}>
      {icon && <div className={iconClass}>{icon}</div>}
      <p>{btnText}</p>
    </button>
  );
};
