import { JSX } from 'react';

interface InlineErrorProps {
  content?: string | JSX.Element;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  justify?: 'center' | 'start' | 'end';
}

const sizeClass: Record<NonNullable<InlineErrorProps['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

const justifyClass: Record<NonNullable<InlineErrorProps['justify']>, string> = {
  center: 'text-center',
  start: 'text-start',
  end: 'text-end',
};

/**
 * A reusable error message component.
 *
 * - Accepts either a string or JSX element as its content.
 * - If content is unspecified, falls back to a generic message.
 * - Uses text with font size = `size`.
 */
const InlineError = ({
  content = 'An unexpected error occured.',
  size = 'md',
  justify = 'center',
}: InlineErrorProps) => {
  return (
    <p className={`w-full ${justifyClass[justify]} ${sizeClass[size]} text-red-600 dark:text-red-400`}>
      {content}
    </p>
  );
};

export default InlineError;
