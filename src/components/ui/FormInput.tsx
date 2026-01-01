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
    <div className='relative z-0 w-full mb-5 group'>
      <label htmlFor={id} className='block mb-2.5 text-sm font-medium text-heading'>
        {label}
      </label>
      <input
        type={type}
        {...register(id, { required })}
        placeholder={placeholder}
        className='border border-gray-500 text-heading text-sm rounded-lg focus:ring-brand focus:border-brand block w-full px-3 py-2 shadow-xs placeholder:text-body'
        spellCheck={spellCheck}
        autoComplete={autoComplete ? 'on' : 'off'}
      />
    </div>
  );
};

export default FormInput;
