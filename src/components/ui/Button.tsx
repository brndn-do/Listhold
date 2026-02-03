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
        className={`${semibold ? 'font-semibold ' : ''}text-purple-700 dark:text-purple-400 border-[1.5px] border-purple-700 dark:border-purple-600 hover:bg-foreground/3 hover:cursor-pointer inline-flex text-sm rounded-xl px-3.5 py-1.75`}
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
      className={`${disabled ? 'bg-purple-800/50 dark:bg-purple-600/50 text-gray-100 dark:text-gray-400 backdrop-blur' : 'text-white bg-purple-700 dark:bg-purple-600 hover:cursor-pointer hover:bg-purple-800 dark:hover:bg-purple-700'} ${semibold ? 'font-semibold ' : ''}inline-flex text-sm rounded-xl px-3.5 py-1.75`}
    >
      {content}
    </button>
  );
};

export default Button;
