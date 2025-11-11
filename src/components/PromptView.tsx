'use client';

import { PromptData } from '@/types';

interface PromptViewProps {
  promptData: PromptData;
  handleNext: (answer: boolean | null) => void;
}

const PromptView = ({ promptData, handleNext }: PromptViewProps) => {
  return (
    <div className='h-86 w-86 flex flex-col items-center border rounded-3xl px-4 py-2 gap-16'>
      {/* Scrollable text area */}
      <div className='h-full w-full overflow-y-auto'>
        <p>{promptData.text}</p>
      </div>

      {promptData.type === 'notice' && (
        <div>
          <button onClick={(() => handleNext(null))} className='hover:cursor-pointer text-purple-500 underline'>I understand</button>
        </div>
      )}
      {promptData.type === 'yes/no' && (
        <div className='flex gap-16'>
          <button onClick={(() => handleNext(true))} className='hover:cursor-pointer text-purple-500 underline'>Yes</button>
          <button onClick={(() => handleNext(false))} className='hover:cursor-pointer text-purple-500 underline'>No</button>
        </div>
      )}
    </div>
  );
};

export default PromptView;
