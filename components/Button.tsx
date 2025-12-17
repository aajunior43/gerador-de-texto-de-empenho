import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Dark Neomorphism base styles
  // Background matches body #212121
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 font-semibold rounded-[20px] transition-all duration-300 ease-in-out focus:outline-none transform active:scale-[0.98]";
  
  // Dark Neumorphic shadows
  // Dark shadow: #191919, Light shadow: #292929
  const neumorphicShadow = "shadow-[6px_6px_12px_#191919,-6px_-6px_12px_#292929]";
  const neumorphicHover = "hover:shadow-[8px_8px_16px_#191919,-8px_-8px_16px_#292929]";
  const neumorphicActive = "active:shadow-[inset_6px_6px_12px_#191919,inset_-6px_-6px_12px_#292929]";
  
  const variants = {
    // Primary: Light blue text for contrast against dark bg
    primary: `bg-[#212121] text-blue-400 ${neumorphicShadow} ${neumorphicHover} ${neumorphicActive}`,
    // Secondary: Light gray text
    secondary: `bg-[#212121] text-gray-400 ${neumorphicShadow} ${neumorphicHover} ${neumorphicActive}`,
    // Icon button
    icon: `bg-[#212121] text-gray-400 p-3 rounded-full ${neumorphicShadow} ${neumorphicHover} ${neumorphicActive}`
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = props.disabled ? "opacity-50 cursor-not-allowed shadow-none" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${disabledClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};