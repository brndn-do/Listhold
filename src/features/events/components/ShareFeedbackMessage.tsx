type ShareFeedbackMessageProps = {
  message: string | null;
};

const ShareFeedbackMessage = ({ message }: ShareFeedbackMessageProps) => {
  if (!message) return null;

  return (
    <div className='fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg dark:bg-gray-200 dark:text-gray-800'>
      {message}
    </div>
  );
};

export default ShareFeedbackMessage;
