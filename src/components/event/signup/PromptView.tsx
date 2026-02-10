'use client';

import { useState, useEffect, useRef } from 'react';

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
  const textRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Check if text is scrollable and at bottom
  useEffect(() => {
    const checkScrollable = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = textRef.current;
        setIsScrollable(scrollHeight > clientHeight);
        // Use a small threshold (1px) for float inconsistencies
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
      }
    };

    // Check immediately and after a short delay to allow for layout updates
    checkScrollable();
    const timeoutId = setTimeout(checkScrollable, 0);

    const element = textRef.current;
    if (element) {
      element.addEventListener('scroll', checkScrollable);
    }
    window.addEventListener('resize', checkScrollable);

    return () => {
      clearTimeout(timeoutId);
      if (element) {
        element.removeEventListener('scroll', checkScrollable);
      }
      window.removeEventListener('resize', checkScrollable);
    };
  }, [prompt.text]);

  // Update local state if the answer from parent changes
  useEffect(() => {
    setSelectedAnswer(currentAnswer ?? null);
  }, [currentAnswer]);

  // Notify parent of answer changes
  useEffect(() => {
    onAnswerChange(selectedAnswer);
  }, [selectedAnswer, onAnswerChange]);

  return (
    <div className='flex w-full flex-col items-center gap-2'>
      {/* Question text */}
      <div className='relative w-full'>
        <div ref={textRef} className='max-h-48 w-full overflow-y-auto'>
          <p className='text-center text-lg font-semibold md:text-2xl'>{prompt.text}</p>
        </div>

        {/* Scroll indicator */}
        {isScrollable && !isAtBottom && (
          <div className='pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center py-2'>
            <svg
              className='h-6 w-6 animate-bounce rounded-full bg-black/50 text-white dark:bg-gray-500/50'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      {prompt.type !== 'notice' && (
        <p className='max-w-md text-center text-sm text-gray-600 dark:text-gray-400'>
          {prompt.private
            ? 'Your answer will only be visible to event organizers.'
            : 'Your answer will be visible to everyone'}
        </p>
      )}

      {/* Required indicator */}
      {prompt.required && prompt.type !== 'notice' && (
        <p className='mt-1 text-xs text-red-600 dark:text-red-400'>* Required</p>
      )}

      {/* Answer options */}
      <div className='mt-1 flex w-full flex-col items-center gap-4'>
        {prompt.type === 'notice' ? (
          <label className='group flex cursor-pointer items-center gap-2'>
            <input
              type='checkbox'
              checked={selectedAnswer === true}
              onChange={(e) => setSelectedAnswer(e.target.checked ? true : null)}
              className='h-4 w-4 cursor-pointer accent-purple-600'
            />
            <span className='text-md font-medium text-gray-700 md:text-lg dark:text-gray-300'>
              Click to continue
            </span>
          </label>
        ) : (
          <>
            {/* Yes/No radio buttons */}
            <div className='flex gap-8'>
              <label className='group flex cursor-pointer items-center gap-3'>
                <input
                  type='radio'
                  name='answer'
                  checked={selectedAnswer === true}
                  onChange={() => setSelectedAnswer(true)}
                  className='h-5 w-5 cursor-pointer accent-purple-600'
                />
                <span className='text-md font-medium text-gray-700 transition-colors group-hover:text-purple-600 md:text-lg dark:text-gray-300 dark:group-hover:text-purple-400'>
                  Yes
                </span>
              </label>

              <label className='group flex cursor-pointer items-center gap-3'>
                <input
                  type='radio'
                  name='answer'
                  checked={selectedAnswer === false}
                  onChange={() => setSelectedAnswer(false)}
                  className='h-5 w-5 cursor-pointer accent-purple-600'
                />
                <span className='text-md font-medium text-gray-700 transition-colors group-hover:text-purple-600 md:text-lg dark:text-gray-300 dark:group-hover:text-purple-400'>
                  No
                </span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Option to clear answer for questions that are not required */}
      {selectedAnswer !== null && !prompt.required && prompt.type !== 'notice' && (
        <button
          onClick={() => setSelectedAnswer(null)}
          className='mt-2 mb-[-16] text-sm text-purple-600 underline hover:cursor-pointer dark:text-purple-400'
        >
          Clear answer
        </button>
      )}
    </div>
  );
};

export default PromptView;
