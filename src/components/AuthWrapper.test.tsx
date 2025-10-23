import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthWrapper from './AuthWrapper';
import { signInWithPopup, signOut } from 'firebase/auth';
import { axe } from 'jest-axe';
import { saveUserDocument } from '@/services/userService';

jest.mock('@/lib/firebase', () => ({
  auth: {}, // Provide a simple placeholder object for the auth export
}));

jest.mock('@/services/userService', () => ({
  saveUserDocument: jest.fn(),
}));
// cast mock
const saveUserDocumentMock = saveUserDocument as jest.Mock;

// --- Mock firebase/auth ---
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));
// Cast mocks for TypeScript support
const signInWithPopupMock = signInWithPopup as jest.Mock;
const signOutMock = signOut as jest.Mock;

// --- Mock useAuth from AuthProvider ---
jest.mock('@/context/AuthProvider', () => ({
  ...jest.requireActual('@/context/AuthProvider'),
  useAuth: jest.fn(),
}));
import { useAuth } from '@/context/AuthProvider';
const useAuthMock = useAuth as jest.Mock;

const mockUser = {
  uid: '123',
  displayName: 'user',
  email: 'user@mail.com',
  photoURL: 'http://example.com/photo.jpg',
};

describe('AuthWrapper component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Signed out', () => {
    beforeEach(() => {
      useAuthMock.mockReturnValue({ user: null, loading: false });
      render(<AuthWrapper />);
    });

    describe('UI', () => {
      it('should render sign in', () => {
        expect(
          screen.getByRole('button', {
            name: /sign in with google/i,
          }),
        ).toBeInTheDocument();
      });

      it('should not render sign out', () => {
        expect(
          screen.queryByRole('button', {
            name: /sign out/i,
          }),
        ).not.toBeInTheDocument();
      });
    });

    describe('Action', () => {
      it('should call signInWithPopup and then saveUserDocument on success', async () => {
        const mockAuthResult = {
          user: {
            uid: 'test-uid-123',
            displayName: 'New User',
            email: 'new@example.com',
            photoURL: 'http://example.com/new.jpg',
          },
        };
        signInWithPopupMock.mockResolvedValue(mockAuthResult);

        const signInButton = screen.getByRole('button', { name: /sign in with google/i });
        fireEvent.click(signInButton);

        await waitFor(() => {
          expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
          expect(saveUserDocumentMock).toHaveBeenCalledTimes(1);
          expect(saveUserDocumentMock).toHaveBeenCalledWith({
            uid: 'test-uid-123',
            displayName: 'New User',
            email: 'new@example.com',
            photoURL: 'http://example.com/new.jpg',
          });
        });
      });
    });

    describe('Accessibility', () => {
      it('should not have accessibility violations', async () => {
        const { container } = render(<AuthWrapper />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Signed in', () => {
    beforeEach(() => {
      useAuthMock.mockReturnValue({ user: mockUser, loading: false });
      render(<AuthWrapper />);
    });

    describe('UI', () => {
      it('should render sign out button', () => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });

      it('should not render sign in', () => {
        expect(
          screen.queryByRole('button', { name: /sign in with google/i }),
        ).not.toBeInTheDocument();
      });
    });
    describe('Action', () => {
      it('should call signOut when sign out button is clicked', () => {
        const signOutButton = screen.getByRole('button', { name: /sign out/i });
        fireEvent.click(signOutButton);
        expect(signOutMock).toHaveBeenCalled();
      });
    });
    describe('Accessibility', () => {
      it('should not have accessibility violations', async () => {
        const { container } = render(<AuthWrapper />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
