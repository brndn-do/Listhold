'use client';

import { PromptData } from '@/types';

interface PromptViewProps {
  promptData: PromptData;
  handleNext: () => void;
}

const PromptView = ({ promptData, handleNext }: PromptViewProps) => {
  return (
    <div className='flex flex-col border rounded-lg p-2'>
      <div className='flex justify-between gap-4'>
        <p>{promptData.text}</p>
        {promptData.type === 'notice' && (
          <div>
            <button className='text-purple-500 underline'>I understand</button>
          </div>
        )}
        {promptData.type === 'yes/no' && (
          <div className='flex gap-4'>
            <button className='text-purple-500 underline'>Yes</button>
            <button className='text-purple-500 underline'>No</button>
          </div>
        )}
      </div>
      <button onClick={handleNext}>Next</button>
    </div>
  );
};

export default PromptView;
