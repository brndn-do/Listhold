import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import Auth from './Auth';

describe('Auth component', () => {
  const mockUser = {
    uid: '123',
    displayName: 'user',
    email: 'user@mail.com',
    photoURL: 'http://example.com/photo.jpg',
  };
  const onSignIn = jest.fn();
  const onSignOut = jest.fn();

  beforeEach(() => {
    onSignIn.mockClear();
    onSignOut.mockClear();
  });

  it('should render a "Sign in with Google" button', () => {
    render(<Auth onSignIn={onSignIn} onSignOut={onSignOut} />);

    const signInButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });

    expect(signInButton).toBeInTheDocument();
  });

  it('should render user name and a "Sign Out" button when a user is provided', () => {
    render(<Auth user={mockUser} onSignIn={onSignIn} onSignOut={onSignOut} />);

    const elementWithName = screen.getByText(new RegExp(mockUser.displayName, 'i'));
    const signOutButton = screen.getByRole('button', {
      name: /sign out/i,
    });

    expect(elementWithName).toBeInTheDocument();
    expect(signOutButton).toBeInTheDocument();

    const signInButton = screen.queryByRole('button', {
      name: /sign in with google/i,
    });
    expect(signInButton).not.toBeInTheDocument();
  });

  it('should render profile photo when a user is provided', () => {
    render(<Auth user={mockUser} onSignIn={onSignIn} onSignOut={onSignOut} />);

    const profilePhoto = screen.getByAltText(/your profile photo/i);
    expect(profilePhoto).toBeInTheDocument();
    expect(profilePhoto).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent(mockUser.photoURL)),
    );
  });

  it('should call only onSignIn when clicked while signed out', () => {
    render(<Auth onSignIn={onSignIn} onSignOut={onSignOut} />);
    const signInButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    fireEvent.click(signInButton);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it('should call only onSignOut when clicked while signed in', () => {
    render(<Auth user={mockUser} onSignIn={onSignIn} onSignOut={onSignOut} />);
    const signOutButton = screen.getByRole('button', {
      name: /sign out/i,
    });
    fireEvent.click(signOutButton);
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(
      <Auth user={mockUser} onSignIn={onSignIn} onSignOut={onSignOut} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
