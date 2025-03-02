import React from "react";

export interface ButtonProps {
  icon?: React.ReactNode;
  iconClass?: string;
  btnText?: string;
  className?: string;
  type: "button" | "submit" | "reset";
  onClick?: () => void;
}
