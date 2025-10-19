import { doc, setDoc } from 'firebase/firestore';
import { saveUserDocument } from './userService';

jest.mock('@/lib/firebase', () => ({ db: 'mockdb' })); // Mock our internal db export

// mock firestore functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock_timestamp'), // return a predictable value
}));

const docMock = doc as jest.Mock;
const setDocMock = setDoc as jest.Mock;

describe('saveUserdocument', () => {
  // clear mock
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call setDoc with the correct user data and merge option', async () => {
    const mockUser = {
      uid: '123',
      displayName: 'user',
      email: 'user@mail.com',
      photoURL: 'http://example.com/photo.jpg',
    };
    // doc returns a doc reference, mock it
    const mockDocRef = { id: 'mock-ref' };
    docMock.mockReturnValue(mockDocRef);

    await saveUserDocument(mockUser);

    expect(docMock).toHaveBeenCalledWith('mockdb', 'users', '123');

    expect(setDocMock).toHaveBeenCalledWith(
      mockDocRef,
      {
        displayName: 'user',
        email: 'user@mail.com',
        photoURL: 'http://example.com/photo.jpg',
        lastLogin: 'mock_timestamp',
      },
      { merge: true },
    );
  });
});
