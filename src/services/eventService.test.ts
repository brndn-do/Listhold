import { doc, onSnapshot } from 'firebase/firestore';
import { streamEventById } from './eventService';

jest.mock('@/lib/firebase', () => ({ db: 'mockdb' })); // Mock our internal db export

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));

const docMock = doc as jest.Mock;
const onsnapshotMock = onSnapshot as jest.Mock;

describe('streamEventById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockId = 'mockId';
  const mockDocRef = { id: 'mock-ref' };
  const mockHandler = jest.fn();
  const mockErrorHandler = jest.fn();
  const mockUnsubscribe = jest.fn();

  it('should call doc and onSnapshot and return the listener if event is found', async () => {
    docMock.mockReturnValue(mockDocRef);
    onsnapshotMock.mockReturnValue(mockUnsubscribe);

    const result = streamEventById(mockId, mockHandler, mockErrorHandler);

    expect(result).toBe(mockUnsubscribe);

    expect(docMock).toHaveBeenCalledWith('mockdb', 'events', mockId);
    expect(onsnapshotMock).toHaveBeenCalledWith(
      mockDocRef,
      expect.any(Function),
      expect.any(Function),
    );
  });
});
