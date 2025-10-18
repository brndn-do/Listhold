import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

jest.mock('../components/AuthWrapper', () => {
  return function MockAuth() {
    return <div data-testid='auth-wrapper' />;
  };
});

describe('Layout page', () => {
  it('should pass', () => {
    render(
      <RootLayout>
        <div></div>
      </RootLayout>,
    );
    expect(screen.getByTestId('auth-wrapper')).toBeInTheDocument();
  });
});
