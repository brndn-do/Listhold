import { fireEvent, render, screen } from '@testing-library/react';
import AuthWrapper from './AuthWrapper';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { axe } from 'jest-axe';

jest.mock('../lib/firebase', () => ({
  auth: {}, // Provide a simple placeholder object for the auth export
}));

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

// --- Mock react-firebase-hooks/auth ---
jest.mock('react-firebase-hooks/auth');
const useAuthStateMock = useAuthState as jest.Mock;

describe('AuthWrapper component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Signed out', () => {
    beforeEach(() => {
      useAuthStateMock.mockReturnValue([null, false, undefined]);
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
      it('should call signInWithPopup when sign in button is clicked', () => {
        const signInButton = screen.getByRole('button', {
          name: /sign in with google/i,
        });
        fireEvent.click(signInButton);
        expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
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
    const mockUser = {
      uid: '123',
      displayName: 'user',
      email: 'user@mail.com',
    };

    beforeEach(() => {
      useAuthStateMock.mockReturnValue([mockUser, false, undefined]);
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
        expect(signOutMock).toHaveBeenCalledTimes(1);
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
