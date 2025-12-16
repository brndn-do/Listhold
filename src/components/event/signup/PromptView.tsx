'use client';

export interface Prompt {
  id: string;
  type: 'yes/no' | 'notice';
  text: string;
  required: boolean;
  private: boolean;
}

interface PromptViewProps {
  prompt: {
    id: string;
    type: 'yes/no' | 'notice';
    text: string;
    required: boolean;
    private: boolean;
  };
  handleNext: (answer: boolean | null) => void;
}

const PromptView = ({ prompt, handleNext }: PromptViewProps) => {
  return (
    <div className='text-lg max-h-86 w-86 flex flex-col items-center text-center gap-4'>
      {/* Scrollable text area */}
      <div className='h-full overflow-y-auto'>
        <p className='text-xl'>{prompt.text}</p>
      </div>

      {/* A notice for users on visibility */}
      {prompt.type !== 'notice' && (
        <p className='text-sm opacity-65'>
          {prompt.private
            ? 'Your answer will not be publicly displayed, but will be visible to event organizers.'
            : 'Your answer may be displayed to others'}
        </p>
      )}

      {/* Separator */}
      <div className='w-full border-b opacity-50'></div>

      {/* Render "I understand" */}
      {prompt.type === 'notice' && (
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
      {prompt.type === 'yes/no' && (
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
