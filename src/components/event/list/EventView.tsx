import EventInfo from './EventInfo';
import EventListWrapper from './EventListWrapper';

const EventView = () => {
  return (
    <div className='flex flex-col gap-1 items-center p-4 h-full w-full md:w-[50%] lg:w-[40%] xl:w-[30%] 2xl:w-[25%]'>
      <EventInfo />
      <div className='border-b-1 border-dashed border-gray-500 w-[90%]'></div> {/* separator */}
      <EventListWrapper />
    </div>
  );
};
export default EventView;
