import { JSX } from 'react';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  content: JSX.Element | string;
}

const Button = ({ onClick, content, disabled }: ButtonProps) => {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={!!disabled}
      className={`${disabled ? 'opacity-35' : 'hover:cursor-pointer hover:bg-purple-800 dark:hover:bg-purple-700'} inline-flex text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-1.75 dark:bg-purple-600 dark:focus:ring-purple-900`}
    >
      {content}
    </button>
  );
};

export default Button;
