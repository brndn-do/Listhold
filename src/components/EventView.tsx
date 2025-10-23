import EventInfo from './EventInfo';
import Roster from './Roster';

const EventView = ({ eventId }: { eventId: string }) => {
  return (
    <div className='flex flex-col items-center p-4 gap-8'>
      <EventInfo eventId={eventId} />
      <Roster eventId={eventId} />
    </div>
  );
};
export default EventView;
