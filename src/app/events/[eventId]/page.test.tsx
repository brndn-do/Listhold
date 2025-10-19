import { notFound } from 'next/navigation';
import { getEventNameAndDescById } from '@/services/server-only/eventNameAndDescService';
import { generateMetadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));
jest.mock('@/services/server-only/eventNameAndDescService', () => ({
  getEventNameAndDescById: jest.fn(),
}));
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

const notFoundMock = notFound as unknown as jest.Mock;
const getEventNameAndDescByIdMock = getEventNameAndDescById as jest.Mock;

describe('generateMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct metadata when event is found', async () => {
    const mockEvent = {
      name: 'mock name',
      description: 'mock description',
    };
    getEventNameAndDescByIdMock.mockResolvedValue(mockEvent);

    const result = await generateMetadata({ params: Promise.resolve({ eventId: 'mockid' }) });

    expect(result).toEqual({
      title: expect.stringMatching(/.*mock name.*/),
      description: 'mock description',
    });
  });
  it('should return default only title if description is null', async () => {
    const mockEvent = {
      name: 'mock name',
    };
    getEventNameAndDescByIdMock.mockResolvedValue(mockEvent);
    const result = await generateMetadata({ params: Promise.resolve({ eventId: 'mockid' }) });

    expect(result).toEqual({
      title: expect.stringMatching(/.*mock name*/),
    });
  });
  it('should call notFound if event is not found', async () => {
    getEventNameAndDescByIdMock.mockResolvedValue(null);
    await generateMetadata({ params: Promise.resolve({ eventId: 'mockid' }) });
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('should throw an error if getEventNameAndDescById errors', async () => {
    const mockError = new Error('Firestore error');
    getEventNameAndDescByIdMock.mockRejectedValue(mockError);

    await expect(
      generateMetadata({ params: Promise.resolve({ eventId: 'mockid' }) }),
    ).rejects.toThrow(mockError);
  });
});
