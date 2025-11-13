import { doc, setDoc } from 'firebase/firestore';
import { saveUserDocument } from './userService';
import { User, UserCredential } from 'firebase/auth';

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

// saveUserDocument expects a full UserCredential object
// define partial types and use type assertion
type PartialUser = Pick<User, 'uid' | 'displayName' | 'email' | 'photoURL'>; // saveUserDocument should only ever use these
type PartialUserCredential = { user: PartialUser }; // saveUserDocument should only ever access the user field

const mockPartialUserCredential: PartialUserCredential = {
  user: {
    uid: '123',
    displayName: 'user',
    email: 'user@mail.com',
    photoURL: 'http://example.com/photo.jpg',
  },
};

const mockUserCredential = mockPartialUserCredential as UserCredential;

describe('saveUserdocument', () => {
  // clear mock
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call setDoc with the correct user data and merge option', async () => {
    // doc returns a doc reference, mock it
    const mockDocRef = { id: 'mock-ref' };
    docMock.mockReturnValue(mockDocRef);

    await saveUserDocument(mockUserCredential);

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

  it('should throw if setDoc fails', async () => {
    const mockError = new Error('Firestore error');
    setDocMock.mockRejectedValue(mockError);
    await expect(saveUserDocument(mockUserCredential)).rejects.toThrow('Firestore error');
  });
});
