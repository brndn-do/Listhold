import { getEventNameAndDescById } from './eventNameAndDescService';

let getResult: () => Promise<{
  exists: boolean;
  data: () => { name: string; description?: string } | null;
}>;

jest.mock('@/lib/firebase-admin', () => {
  return {
    adminDb: {
      collection: (_: string) => ({
        doc: (_: string) => ({
          get: async () => getResult(),
        }),
      }),
    },
  };
});

describe('getEventNameAndDescById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEventId = '123';
  const mockEventName = 'mock event name';
  const mockEventDescription = 'mock event description';

  it('should return name and description if data is found', async () => {
    getResult = async () => ({
      exists: true,
      data: () => ({ name: mockEventName, description: mockEventDescription }),
    });

    const result = await getEventNameAndDescById(mockEventId);
    expect(result).toEqual({
      name: 'mock event name',
      description: 'mock event description',
    });
  });

  it('should return null if not found', async () => {
    getResult = async () => ({
      exists: false,
      data: () => null,
    });
    const result = await getEventNameAndDescById(mockEventId);
    expect(result).toBeNull();
  });

  it('should throw if firestore errors', async () => {
    const mockError = new Error('Firestore error');
    getResult = async () => {
      throw mockError;
    };
    await expect(getEventNameAndDescById(mockEventId)).rejects.toThrow(mockError);
  });
});
