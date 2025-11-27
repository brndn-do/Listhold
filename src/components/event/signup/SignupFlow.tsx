'use client';

import { useEvent } from '@/context/EventProvider';
import Spinner from '../../ui/Spinner';
import PromptView from './PromptView';
import { useState } from 'react';
import { PromptData } from '@/types/promptData';

interface SignupFlowProps {
  handleFlowClose: (answers: Record<string, boolean | null>) => void;
}

const SignupFlow = ({ handleFlowClose }: SignupFlowProps) => {
  const { prompts, promptsLoading, promptsError } = useEvent();
  const [curIndex, setCurIndex] = useState(0);

  // turn the map into an array of [string, PromptData], sorted by the order field
  const promptsArray: [string, PromptData][] | undefined = prompts
    ? Object.entries(prompts).sort((a, b) => a[1].order - b[1].order)
    : undefined;

  // Right now, we only support yes/no (bool) and "I understand" (null) as responses.
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});

  const handleNext = (answer: boolean | null) => {
    if (!promptsArray) return;

    // store user's answers
    const curPromptId = promptsArray[curIndex][0];
    const updatedAnswers = { ...answers, [curPromptId]: answer };
    setAnswers(updatedAnswers);

    if (curIndex + 1 < promptsArray.length) {
      setCurIndex(curIndex + 1);
    } else {
      // submit user's answers
      handleFlowClose(updatedAnswers);
    }
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      className='fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50'
    >
      {promptsLoading && <Spinner />}
      {promptsError && <p>{promptsError.message}</p>}
      {promptsArray && (
        <>
          <PromptView promptData={promptsArray[curIndex][1]} handleNext={handleNext} />
        </>
      )}
    </div>
  );
};

export default SignupFlow;
