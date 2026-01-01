'use client';

import { useEvent } from '@/context/EventProvider';
import PromptView from './PromptView';
import { useState } from 'react';

interface SignupFlowProps {
  handleFlowClose: (answers: Record<string, boolean | null>) => void;
}

const SignupFlow = ({ handleFlowClose }: SignupFlowProps) => {
  const { prompts } = useEvent();
  const [curIndex, setCurIndex] = useState(0);

  // Right now, we only support yes/no (bool) and "I understand" (null) as responses.
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});

  const handleNext = (answer: boolean | null) => {
    // store user's answers
    const curPromptId = prompts[curIndex].id;
    const updatedAnswers = { ...answers, [curPromptId]: answer };
    setAnswers(updatedAnswers);

    if (curIndex + 1 < prompts.length) {
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
      className='fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50'
    >
      <PromptView prompt={prompts[curIndex]} handleNext={handleNext} />
    </div>
  );
};

export default SignupFlow;
