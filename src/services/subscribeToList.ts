import { supabase } from '@/lib/supabase';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { throttle, debounce } from 'lodash';

export const subscribeToList = (
  eventId: string,
  setListState: () => void,
  setConnectionState: (connected: boolean) => void,
) => {
  // If there is a burst of db writes, prevent re-fetching too aggressively
  // by having it run at most once every 500ms
  const throttledSetListState = throttle(setListState, 500);

  // Add a 5-second delay before marking the connection as "failed",
  // preventing UI flickering if connection breaks for just a short moment
  const debouncedSetConnectionState = debounce(setConnectionState, 5000);

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
        // immediately indicate realtime is live
        debouncedSetConnectionState.cancel();
        setConnectionState(true);
      } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
        // immediately indicate disconnected
        debouncedSetConnectionState.cancel();
        setConnectionState(false);
      } else if (status === 'CHANNEL_ERROR') {
        // indicate disconnected if no change for 5s
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
