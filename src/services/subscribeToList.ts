import { supabase } from '@/lib/supabase';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { throttle, debounce } from 'lodash';

export const subscribeToList = (
  eventId: string,
  setListState: () => void,
  setConnectionState: (connected: boolean) => void,
) => {
  const throttledSetListState = throttle(setListState, 500);
  const debouncedSetConnectionState = debounce(setConnectionState, 3000);
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
        debouncedSetConnectionState.cancel();
        setConnectionState(true);
      } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
        debouncedSetConnectionState.cancel();
        setConnectionState(false);
      } else if (status === 'CHANNEL_ERROR') {
        debouncedSetConnectionState.cancel();
        debouncedSetConnectionState(false);
      }
    });

  return () => {
    throttledSetListState.cancel();
    debouncedSetConnectionState.cancel();
    supabase.removeChannel(channel);
  };
};
