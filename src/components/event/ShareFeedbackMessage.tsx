type ShareFeedbackMessageProps = {
  message: string | null;
};

const ShareFeedbackMessage = ({ message }: ShareFeedbackMessageProps) => {
  if (!message) return null;

  return (
    <div className='fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-lg shadow-lg text-sm'>
      {message}
    </div>
  );
};

export default ShareFeedbackMessage;
