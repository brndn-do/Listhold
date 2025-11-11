'use client';

import { useEvent } from '@/context/EventProvider';
import Spinner from './Spinner';
import PromptView from './PromptView';
import { useState } from 'react';

interface SignupFlowProps {
  handleFlowClose: (answers: Record<string, boolean | null>) => void;
}

const SignupFlow = ({ handleFlowClose }: SignupFlowProps) => {
  const { prompts, promptsLoading, promptsError } = useEvent();
  const [curIndex, setCurIndex] = useState(0);

  // Right now, we only support yes/no (bool) and "I understand" (null) as responses.
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});

  const handleNext = (answer: boolean | null) => {
    if (promptsLoading || promptsError || !prompts) return;

    // store user's answers
    const curPromptId = prompts[curIndex].id;
    setAnswers({ ...answers, [curPromptId]: answer });

    if (curIndex + 1 < prompts.length) {
      setCurIndex(curIndex + 1);
    } else {
      // submit user's answers
      handleFlowClose(answers);
    }
  };

  return (
    <div role='dialog' className='fixed inset-0 bg-white/50 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center z-50'>
      {promptsLoading && <Spinner />}
      {promptsError && <p>{promptsError.message}</p>}
      {prompts && (
        <>
          <PromptView promptData={prompts[curIndex]} handleNext={handleNext} />
        </>
      )}
    </div>
  );
};

export default SignupFlow;
