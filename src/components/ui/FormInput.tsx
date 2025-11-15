interface FormInputProps {
  id: string;
  required: boolean;
  text: string;
}

const FormInput = ({ id, text, required }: FormInputProps) => {
  return (
    <div className='relative z-0 w-full mb-5 group'>
      <input
        type='text'
        id={id}
        className='block py-2.5 px-0 w-full text-sm text-heading bg-transparent border-0 border-b-2 border-default-medium appearance-none focus:outline-none focus:ring-0 focus:border-brand peer'
        placeholder=' '
        required={!!required}
      />
      <label
        htmlFor={id}
        className='absolute text-sm text-body duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-fg-brand peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto'
      >
        {text}
      </label>
    </div>
  );
};

export default FormInput;
