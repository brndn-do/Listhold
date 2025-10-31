import { Timestamp } from 'firebase/firestore';
import formatEventTiming from './formatEventTiming';
import { format } from 'date-fns';

jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn(),
}));

const mockFormat = format as jest.Mock;

describe('formatEventTiming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format same day correctly', () => {
    mockFormat.mockReturnValueOnce('1');
    mockFormat.mockReturnValueOnce('2');
    mockFormat.mockReturnValueOnce('3');

    const mockStartDate = new Date(2025, 9, 30, 9, 0, 0, 0);
    const mockEndDate = new Date(2025, 9, 30, 10, 0, 0, 0);
    const mockStartTimeStamp = Timestamp.fromDate(mockStartDate);
    const mockEndTimeStamp = Timestamp.fromDate(mockEndDate);
    const result = formatEventTiming(mockStartTimeStamp, mockEndTimeStamp);

    expect(result).toBe('1, 2 - 3');
    expect(mockFormat).toHaveBeenCalledWith(mockStartDate, 'MM/dd/yyyy');
    expect(mockFormat).toHaveBeenCalledWith(mockStartDate, 'h:mm a');
    expect(mockFormat).toHaveBeenCalledWith(mockEndDate, 'h:mm a');
  });

  it('should format multi-day correctly', () => {
    mockFormat.mockReturnValueOnce('1');
    mockFormat.mockReturnValueOnce('2');

    const mockStartDate = new Date(2025, 9, 30, 9, 0, 0, 0);
    const mockEndDate = new Date(2025, 10, 30, 10, 0, 0, 0);
    const mockStartTimeStamp = Timestamp.fromDate(mockStartDate);
    const mockEndTimeStamp = Timestamp.fromDate(mockEndDate);
    const result = formatEventTiming(mockStartTimeStamp, mockEndTimeStamp);

    expect(result).toBe('1 to 2');
    expect(mockFormat).toHaveBeenCalledWith(mockStartDate, 'MM/dd/yyyy h:mm a');
    expect(mockFormat).toHaveBeenCalledWith(mockEndDate, 'MM/dd/yyyy h:mm a');
  });
});
