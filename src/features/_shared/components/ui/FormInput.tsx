import { InputHTMLAttributes } from 'react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string;
  type?: 'text' | 'number' | 'datetime-local';
  label: string;
  required?: boolean;
  inputClassName?: string;
  containerClassName?: string;
}

/**
 * Reusable labeled input primitive.
 *
 * - Works with controlled or uncontrolled input usage.
 * - Accepts native input props through `inputProps`.
 * - Supports simple style overrides via `inputClassName` and `containerClassName`.
 */
const FormInput = ({
  id,
  type = 'text',
  required,
  label,
  placeholder = ' ',
  spellCheck = false,
  autoComplete = 'off',
  inputClassName = '',
  containerClassName = '',
  ...inputProps
}: FormInputProps) => {
  return (
    <div className={`group relative z-0 mb-5 w-full ${containerClassName}`}>
      <label htmlFor={id} className='text-heading mb-2.5 block text-sm font-medium'>
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={inputProps.name ?? id}
        required={required}
        placeholder={placeholder}
        className={`text-heading focus:ring-brand focus:border-brand placeholder:text-body block w-full rounded-lg border border-gray-500 px-3 py-2 text-sm shadow-xs ${inputClassName}`}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        {...inputProps}
      />
    </div>
  );
};

export default FormInput;
