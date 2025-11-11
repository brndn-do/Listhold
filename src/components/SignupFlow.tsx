'use client';

import { useEvent } from '@/context/EventProvider';
import Spinner from './Spinner';
import PromptView from './PromptView';
import { useState } from 'react';

interface SignupFlowProps {
  handleFlowClose: () => unknown;
}

const SignupFlow = ({ handleFlowClose }: SignupFlowProps) => {
  const { prompts, promptsLoading, promptsError } = useEvent();
  const [curIndex, setCurIndex] = useState(0);

  const handleNext = () => {
    if (promptsLoading || promptsError || !prompts) return;
    // get user's answer and store it somewhere
    if (curIndex + 1 < prompts.length) {
      setCurIndex(curIndex + 1);
    } else {
      // submit
      handleFlowClose();
    }
  };

  return (
    <div role='dialog' className='fixed inset-0 bg-black/90 flex items-center justify-center z-50'>
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
