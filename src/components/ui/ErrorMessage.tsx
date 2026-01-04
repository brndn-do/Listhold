interface ErrorMessageProps {
  content?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  justify?: 'center' | 'start' | 'end';
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
  justify= 'center',
}: ErrorMessageProps) => {
  return <p className={`w-full text-${justify} text-${size} text-red-600 dark:text-red-400`}>{content}</p>;
};

export default ErrorMessage;
