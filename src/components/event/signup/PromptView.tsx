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
    <div className='flex flex-col items-center gap-2 w-full'>
      {/* Question text */}
      <div className='relative w-full'>
        <div ref={textRef} className='max-h-48 overflow-y-auto w-full'>
          <p className='text-lg md:text-2xl font-semibold text-center'>{prompt.text}</p>
        </div>

        {/* Scroll indicator */}
        {isScrollable && !isAtBottom && (
          <div className='absolute inset-x-0 bottom-0 flex justify-center items-end py-2 pointer-events-none'>
            <svg
              className='w-6 h-6 text-white bg-black/50 dark:bg-gray-500/50 rounded-full animate-bounce'
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
        <p className='text-sm text-gray-600 dark:text-gray-400 text-center max-w-md'>
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
      <div className='mt-1 w-full flex flex-col items-center gap-4'>
        {prompt.type === 'notice' ? (
          <label className='flex items-center gap-2 cursor-pointer group'>
            <input
              type='checkbox'
              checked={selectedAnswer === true}
              onChange={(e) => setSelectedAnswer(e.target.checked ? true : null)}
              className='w-4 h-4 cursor-pointer accent-purple-600'
            />
            <span className='text-md md:text-lg font-medium text-gray-700 dark:text-gray-300'>
              Click to continue
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
                <span className='text-md md:text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
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
                <span className='text-md md:text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
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
          className='mt-2 mb-[-16] text-sm text-purple-600 dark:text-purple-400 underline hover:cursor-pointer'
        >
          Clear answer
        </button>
      )}
    </div>
  );
};

export default PromptView;
