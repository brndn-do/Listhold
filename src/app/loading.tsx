const Loading = () => {
  return (
    <div className='flex min-h-[75vh] items-center justify-center'>
      <div className='flex gap-6'>
        <div className='h-4 w-4 animate-bounce rounded-full bg-purple-600 [animation-delay:-0.5s]'></div>
        <div className='h-4 w-4 animate-bounce rounded-full bg-purple-600 [animation-delay:-0.25s]'></div>
        <div className='h-4 w-4 animate-bounce rounded-full bg-purple-600'></div>
      </div>
    </div>
  );
};

export default Loading;
