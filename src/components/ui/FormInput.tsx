interface FormInputProps {
  id: string;
  type?: 'text' | 'number' | 'datetime-local';
  name?: string;
  required: boolean;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  name,
  required,
  label,
  value,
  onChange,
  placeholder = ' ',
  spellCheck = false,
  autoComplete = false,
}: FormInputProps) => {
  return (
    <div className='relative z-0 w-full mb-5 group'>
      <input
        type={type}
        id={id}
        name={name || id}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className='block py-2.5 px-0 w-full text-sm text-heading bg-transparent border-0 border-b-2 border-default-medium appearance-none focus:outline-none focus:ring-0 focus:border-brand peer'
        spellCheck={spellCheck}
        autoComplete={autoComplete ? 'on' : 'off'}
      />
      <label
        htmlFor={id}
        className='absolute text-sm text-body duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-fg-brand peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto'
      >
        {label}
      </label>
    </div>
  );
};

export default FormInput;
