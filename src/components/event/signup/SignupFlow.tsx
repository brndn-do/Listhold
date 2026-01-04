'use client';

import { useEvent } from '@/context/EventProvider';
import PromptView from './PromptView';
import { useState, useEffect } from 'react';

interface SignupFlowProps {
  handleSubmit: (answers: Record<string, boolean | null>) => void;
  handleCancel: () => void;
}

const SignupFlow = ({ handleSubmit, handleCancel }: SignupFlowProps) => {
  const { prompts } = useEvent();
  const [curIndex, setCurIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [currentAnswer, setCurrentAnswer] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleNext = () => {
    // Store user's answer
    const curPromptId = prompts[curIndex].id;
    const updatedAnswers = { ...answers, [curPromptId]: currentAnswer };
    setAnswers(updatedAnswers);

    if (curIndex + 1 < prompts.length) {
      setCurIndex(curIndex + 1);
    } else {
      // Submit user's answers
      handleSubmit(updatedAnswers);
    }
  };

  const handleBack = () => {
    if (curIndex > 0) {
      setCurIndex(curIndex - 1);
    }
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      className={`fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur flex items-center justify-center z-50 p-4 transition-opacity duration-200 ease-in ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-gray-200/50 dark:bg-background/70 rounded-4xl w-full max-w-2xl p-8 transition-all duration-200 ease-in ${
          isVisible ? 'scale-100 opacity-100' : 'scale-25 opacity-0'
        }`}
      >
        {/* Progress indicator */}
        <div className='mb-6'>
          <div className='flex justify-between text-sm text-gray-800 dark:text-gray-400 mb-4'>
            <span>
              {curIndex + 1} of {prompts.length}
            </span>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  handleCancel();
                }, 300);
              }}
              className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:cursor-pointer'
            >
              Cancel
            </button>
          </div>
          <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
            <div
              className='bg-purple-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${((curIndex + 1) / prompts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Prompt content */}
        <PromptView
          prompt={prompts[curIndex]}
          currentAnswer={answers[prompts[curIndex].id]}
          onAnswerChange={setCurrentAnswer}
        />

        {/* Navigation buttons */}
        <div className='flex justify-between mt-8'>
          <button
            onClick={handleBack}
            disabled={curIndex === 0}
            className='px-6 py-2 font-bold text-purple-600 dark:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer transition-colors'
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={(prompts[curIndex].required && currentAnswer === null)}
            className='px-6 py-2 font-bold text-purple-600 dark:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer transition-colors'
          >
            {curIndex === prompts.length - 1 ? 'Submit' : 'Next'} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupFlow;
