import { Timestamp } from 'firebase/firestore';
import { formatEventTiming, formatTimestamp } from './timeFormatter';

/**
 * Use `TZ=UTC jest` when running this test, as it expects UTC timezone.
 */
describe('formatEventTiming', () => {
  it('should format a single-day event correctly', () => {
    const startDate = new Date('2025-10-30T09:00:00Z');
    const endDate = new Date('2025-10-30T17:30:00Z');
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const result = formatEventTiming(startTimestamp, endTimestamp);

    expect(result).toBe('10/30/2025, 9:00 AM - 5:30 PM');
  });

  it('should format a multi-day event correctly', () => {
    const startDate = new Date('2025-11-15T22:00:00Z');
    const endDate = new Date('2025-11-16T10:30:00Z');
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const result = formatEventTiming(startTimestamp, endTimestamp);

    expect(result).toBe('11/15/2025 10:00 PM to 11/16/2025 10:30 AM');
  });
});

describe('formatTimestamp', () => {
  it('should return formatted date and time strings', () => {
    const date = new Date('2025-09-25T14:05:01.123Z');
    const timestamp = Timestamp.fromDate(date);

    const result = formatTimestamp(timestamp);

    expect(result).toEqual({
      formattedDate: '09/25/2025',
      formattedTime: '14:05:01.123',
    });
  });
});
