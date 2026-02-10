import { JSX } from 'react';

interface ButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  content: JSX.Element | string;
  inverted?: boolean;
  semibold?: boolean;
}

/**
 * A reusable button component.
 *
 * - Supports `button` and `submit` types.
 * - Invokes the optional `onClick` callback when pressed.
 * - When `disabled` is true, the button is non-interactive and styled with reduced opacity.
 * - Accepts either a string or JSX element as its content.
 */
const Button = ({
  type = 'button',
  onClick,
  content,
  disabled = false,
  inverted = false,
  semibold = false,
}: ButtonProps) => {
  if (inverted) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={!!disabled}
        className={`hover:bg-foreground/3 inline-flex rounded-xl border-[1.5px] border-pink-500 px-3.5 py-1.75 text-sm text-pink-600 hover:cursor-pointer dark:border-pink-500 dark:text-pink-400 ${
          semibold ? 'font-semibold' : ''
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={!!disabled}
      className={`${disabled ? 'bg-pink-800/50 text-gray-100 backdrop-blur dark:bg-pink-500/50 dark:text-gray-400' : 'bg-pink-500 text-white hover:cursor-pointer hover:bg-pink-600/90 dark:bg-pink-500 dark:hover:bg-pink-500/80'} ${semibold ? 'font-semibold' : ''}inline-flex rounded-xl px-3.5 py-1.75 text-sm`}
    >
      {content}
    </button>
  );
};

export default Button;
