'use client';

import { useEvent } from '@/context/EventProvider';
import PromptView from './PromptView';
import { useState, useEffect } from 'react';

interface SignupWizardProps {
  handleSignup: (answers: Record<string, boolean | null>) => void;
  handleCancel: () => void;
}

const SignupWizard = ({ handleSignup, handleCancel }: SignupWizardProps) => {
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
    // Store user's answer if not notice
    const curPrompt = prompts[curIndex];
    let updatedAnswers = answers;

    if (curPrompt.type !== 'notice') {
      updatedAnswers = { ...answers, [curPrompt.id]: currentAnswer };
      setAnswers(updatedAnswers);
    }

    if (curIndex + 1 < prompts.length) {
      setCurIndex(curIndex + 1);
    } else {
      // Submit user's answers
      handleSignup(updatedAnswers);
    }
  };

  const handleBack = () => {
    // Store user's answer if not notice
    const curPrompt = prompts[curIndex];

    if (curPrompt.type !== 'notice') {
      const updatedAnswers = { ...answers, [curPrompt.id]: currentAnswer };
      setAnswers(updatedAnswers);
    }

    if (curIndex > 0) {
      setCurIndex(curIndex - 1);
    }
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur transition-opacity duration-200 ease-in dark:bg-black/60 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`dark:bg-background/70 w-full max-w-2xl rounded-4xl bg-gray-200/50 p-8 transition-all duration-200 ease-in ${
          isVisible ? 'scale-100 opacity-100' : 'scale-25 opacity-0'
        }`}
      >
        {/* Progress indicator */}
        <div className='mb-6'>
          <div className='mb-4 flex justify-between text-sm text-gray-800 dark:text-gray-400'>
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
              className='text-gray-500 hover:cursor-pointer hover:text-gray-700 dark:hover:text-gray-300'
            >
              Cancel
            </button>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
            <div
              className='h-2 rounded-full bg-pink-400 transition-all duration-300'
              style={{ width: `${((curIndex + 1) / prompts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Prompt content */}
        <PromptView
          key={prompts[curIndex].id}
          prompt={prompts[curIndex]}
          currentAnswer={answers[prompts[curIndex].id]}
          onAnswerChange={setCurrentAnswer}
        />

        {/* Navigation buttons */}
        <div className='mt-8 flex justify-between'>
          <button
            onClick={handleBack}
            disabled={curIndex === 0}
            className='px-6 py-2 font-bold text-pink-600 transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 dark:text-pink-400'
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={prompts[curIndex].required && currentAnswer === null}
            className='px-6 py-2 font-bold text-pink-600 transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 dark:text-pink-400'
          >
            {curIndex === prompts.length - 1 ? 'Submit' : 'Next'} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupWizard;
