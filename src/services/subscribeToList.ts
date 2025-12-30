import { supabase } from '@/lib/supabase';
import { throttle } from 'lodash';

export const subscribeToList = (eventId: string, onChange: () => void) => {
  const throttledOnChange = throttle(onChange, 500);
  const channel = supabase
    .channel(`event_${eventId}_signup_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'signups',
        filter: `event_id=eq.${eventId}`,
      },
      () => {
        throttledOnChange();
      },
    )
    .subscribe();

  return () => {
    throttledOnChange.cancel();
    supabase.removeChannel(channel);
  };
};
