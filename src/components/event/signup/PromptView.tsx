'use client';

import { PromptData } from '@/types';

interface PromptViewProps {
  promptData: PromptData;
  handleNext: (answer: boolean | null) => void;
}

const PromptView = ({ promptData, handleNext }: PromptViewProps) => {
  return (
    <div className='text-lg max-h-86 w-86 flex flex-col items-center text-center gap-4'>
      {/* Scrollable text area */}
      <div className='h-full overflow-y-auto'>
        <p className='text-xl'>{promptData.text}</p>
      </div>

      {/* A notice for users if there is a specified visibility */}
      {promptData.visibility && (
        <p className='text-sm opacity-65'>
          {promptData.visibility === 'public'
            ? 'Your answer may be displayed to others'
            : 'Your answer will not be publicly displayed, but will be visible to event organizers.'}
        </p>
      )}

      {/* Separator */}
      <div className='w-full border-b opacity-50'></div>

      {/* Render "I understand" */}
      {promptData.type === 'notice' && (
        <div>
          <button
            onClick={() => handleNext(null)}
            className='text-xl hover:cursor-pointer text-purple-500 underline'
          >
            I understand
          </button>
        </div>
      )}

      {/* Render "Yes" and "No" */}
      {promptData.type === 'yes/no' && (
        <div className='flex gap-20 '>
          <button
            onClick={() => handleNext(true)}
            className='text-xl hover:cursor-pointer text-purple-500 underline'
          >
            Yes
          </button>
          <button
            onClick={() => handleNext(false)}
            className='text-xl hover:cursor-pointer text-purple-500 underline'
          >
            No
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptView;
