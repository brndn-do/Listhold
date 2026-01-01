import { supabase } from '@/lib/supabase';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { throttle } from 'lodash';

export const subscribeToList = (
  eventId: string,
  setListState: () => void,
  setConnectionState: (connected: boolean) => void,
) => {
  const throttledSetListState = throttle(setListState, 500);
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
        throttledSetListState();
      },
    )
    .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
      if (status === 'SUBSCRIBED') {
        throttledSetListState();
        setConnectionState(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnectionState(false);
      } 
      // ignore CLOSED state
    });

  return () => {
    throttledSetListState.cancel();
    supabase.removeChannel(channel);
  };
};
