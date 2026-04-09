import React from 'react'
import styles from './Button.module.css'

type ButtonProps = {
  text?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  variant = 'primary',
  type = 'button',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  ariaLabel,
  disabled = false,
}) => {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary;
  const iconOnlyClass = iconOnly ? styles.iconOnly : '';
  const resolvedAriaLabel = iconOnly ? ariaLabel ?? text ?? 'Button' : ariaLabel;

  return (
    <button
      type={type}
      className={`${styles.btn} ${variantClass} ${iconOnlyClass}`.trim()}
      onClick={onClick}
      aria-label={resolvedAriaLabel}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && <span className={styles.icon} aria-hidden='true'>{icon}</span>}
      {!iconOnly && text && <span className={styles.label}>{text}</span>}
      {icon && iconPosition === 'right' && <span className={styles.icon} aria-hidden='true'>{icon}</span>}
    </button>
  )
}

export default Button