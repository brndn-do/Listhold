import { useForm } from 'react-hook-form';

interface FormInputProps {
  id: string;
  type?: 'text' | 'number' | 'datetime-local';
  name?: string;
  required: boolean;
  label: string;
  placeholder?: string;
  spellCheck?: boolean;
  autoComplete?: boolean;
}

/**
 * A reusable component that contains a text input and a floating label.
 *
 * - Supports custom `id`, `name`, label text, and placeholder text.
 * - Accepts controlled input via `value` and `onChange`.
 * - Displays a floating label that animates based on focus and input state.
 * - Respects `required`, `spellCheck`, and `autoComplete` settings.
 * - if not provided, spellCheck and autoComplete are set to false.
 */
const FormInput = ({
  id,
  type = 'text',
  required,
  label,
  placeholder = ' ',
  spellCheck = false,
  autoComplete = false,
}: FormInputProps) => {
  const { register } = useForm();
  return (
    <div className='group relative z-0 mb-5 w-full'>
      <label htmlFor={id} className='text-heading mb-2.5 block text-sm font-medium'>
        {label}
      </label>
      <input
        type={type}
        {...register(id, { required })}
        placeholder={placeholder}
        className='text-heading focus:ring-brand focus:border-brand placeholder:text-body block w-full rounded-lg border border-gray-500 px-3 py-2 text-sm shadow-xs'
        spellCheck={spellCheck}
        autoComplete={autoComplete ? 'on' : 'off'}
      />
    </div>
  );
};

export default FormInput;
