import { JSX } from 'react';

interface ErrorMessageProps {
  content?: JSX.Element | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

/**
 * A reusable error message component.
 *
 * - Accepts either a string or JSX element as its content.
 * - If content is unspecified, falls back to a generic message.
 * - Uses text with font size = `size`.
 */
const ErrorMessage = ({
  content = 'An unexpected error occured.',
  size = 'md',
}: ErrorMessageProps) => {
  return <p className={`text-center text-${size} text-red-600 dark:text-red-500`}>{content}</p>;
};

export default ErrorMessage;
