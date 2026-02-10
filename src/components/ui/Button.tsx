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
        className={`${semibold ? 'font-semibold' : ''}text-purple-700 hover:bg-foreground/3 inline-flex rounded-xl border-[1.5px] border-purple-700 px-3.5 py-1.75 text-sm hover:cursor-pointer dark:border-purple-600 dark:text-purple-400`}
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
      className={`${disabled ? 'bg-purple-800/50 text-gray-100 backdrop-blur dark:bg-purple-600/50 dark:text-gray-400' : 'bg-purple-700 text-white hover:cursor-pointer hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700'} ${semibold ? 'font-semibold' : ''}inline-flex rounded-xl px-3.5 py-1.75 text-sm`}
    >
      {content}
    </button>
  );
};

export default Button;
