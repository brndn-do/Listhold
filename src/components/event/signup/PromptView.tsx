'use client';

import { useState, useEffect } from 'react';

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
  currentAnswer?: boolean | null;
  onAnswerChange: (answer: boolean | null) => void;
}

const PromptView = ({ prompt, currentAnswer, onAnswerChange }: PromptViewProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(currentAnswer ?? null);

  // Update local state when navigating back to a previously answered question
  useEffect(() => {
    setSelectedAnswer(currentAnswer ?? null);
  }, [currentAnswer, prompt.id]);

  // Notify parent of answer changes
  useEffect(() => {
    onAnswerChange(selectedAnswer);
  }, [selectedAnswer, onAnswerChange]);

  return (
    <div className='flex flex-col items-center gap-2'>
      {/* Question text */}
      <div className='max-h-48 overflow-y-auto scrollbar-thin w-full'>
        <p className='text-2xl font-semibold text-center'>
          {prompt.text}
        </p>
      </div>

      {/* Privacy notice */}
      {prompt.type !== 'notice' && (
        <p className='text-sm text-gray-600 dark:text-gray-400 text-center max-w-md'>
          {prompt.private
            ? 'Your answer will be visible to event organizers.'
            : 'Your answer may be displayed to others'}
        </p>
      )}

      {/* Required indicator */}
      {prompt.required && prompt.type !== 'notice' && (
        <p className='mt-1 text-xs text-red-600 dark:text-red-400'>* Required</p>
      )}

      {/* Answer options */}
      <div className='mt-2 w-full flex flex-col items-center gap-4'>
        {prompt.type === 'notice' ? (
          <label className='flex items-center gap-2 cursor-pointer group'>
            <input
              type='checkbox'
              checked={selectedAnswer === true}
              onChange={(e) => setSelectedAnswer(e.target.checked ? true : null)}
              className='w-4 h-4 cursor-pointer accent-purple-600'
            />
            <span className='text-lg font-medium text-gray-700 dark:text-gray-300'>
              I understand
            </span>
          </label>
        ) : (
          <>
            {/* Yes/No radio buttons */}
            <div className='flex gap-8'>
              <label className='flex items-center gap-3 cursor-pointer group'>
                <input
                  type='radio'
                  name='answer'
                  checked={selectedAnswer === true}
                  onChange={() => setSelectedAnswer(true)}
                  className='w-5 h-5 cursor-pointer accent-purple-600'
                />
                <span className='text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
                  Yes
                </span>
              </label>

              <label className='flex items-center gap-3 cursor-pointer group'>
                <input
                  type='radio'
                  name='answer'
                  checked={selectedAnswer === false}
                  onChange={() => setSelectedAnswer(false)}
                  className='w-5 h-5 cursor-pointer accent-purple-600'
                />
                <span className='text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
                  No
                </span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PromptView;
