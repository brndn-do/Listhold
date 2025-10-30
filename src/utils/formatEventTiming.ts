import { format, isSameDay } from "date-fns";
import { Timestamp } from "firebase/firestore";

const formatEventTiming = (start: Timestamp, end: Timestamp): string => {
  const startDate = start.toDate();
  const endDate = end.toDate();
  if (isSameDay(startDate, endDate)) {
    // Format for a single-day event
    // "12/01/2025, 7:00 PM - 9:30 PM"
    const formattedDate = format(startDate, 'MM/dd/yyyy');
    const formattedStartTime = format(startDate, 'h:mm a');
    const formattedEndTime = format(endDate, 'h:mm a');
    return `${formattedDate}, ${formattedStartTime} - ${formattedEndTime}`;
  } else {
    // Format for a multi-day event
    // "12/01/2025 7:00 PM to 12/02/2025 9:30 PM"
    const dateTimeFormat = 'MM/dd/yyyy h:mm a';
    const formattedStart = format(startDate, dateTimeFormat);
    const formattedEnd = format(endDate, dateTimeFormat);
    return `${formattedStart} to ${formattedEnd}`;
  }
};

export default formatEventTiming;