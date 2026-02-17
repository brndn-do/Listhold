import LoadingDots from '@/features/_shared/components/ui/LoadingDots';

const Loading = () => {
  return (
    <div className='flex min-h-[75vh] items-center justify-center'>
      <LoadingDots size={4} />
    </div>
  );
};

export default Loading;
