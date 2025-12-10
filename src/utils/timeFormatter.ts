import { format, isSameDay } from 'date-fns';

export const formatEventTiming = (start: Date, end?: Date): string => {
  if (!end) {
    // Format for event with no specified end
    // "12/01/2025, 7:00PM"
    const dateTimeFormat = 'MM/dd/yyyy, h:mm a';
    return format(start, dateTimeFormat);
  } else if (isSameDay(start, end)) {
    // Format for a single-day event
    // "12/01/2025, 7:00 PM - 9:30 PM"
    const formattedDate = format(start, 'MM/dd/yyyy');
    const formattedStartTime = format(start, 'h:mm a');
    const formattedEndTime = format(end, 'h:mm a');
    return `${formattedDate}, ${formattedStartTime} - ${formattedEndTime}`;
  } else {
    // Format for a multi-day event
    // "12/01/2025 7:00 PM to 12/02/2025 9:30 PM"
    const dateTimeFormat = 'MM/dd/yyyy, h:mm a';
    const formattedStart = format(start, dateTimeFormat);
    const formattedEnd = format(end, dateTimeFormat);
    return `${formattedStart} - ${formattedEnd}`;
  }
};

export const formatDate = (date: Date): { formattedDate: string; formattedTime: string } => {
  const formattedDate = format(date, 'MM/dd/yyyy');
  const formattedTime = format(date, 'HH:mm:ss.SSS');
  return { formattedDate, formattedTime };
};
