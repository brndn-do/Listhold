import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import 'whatwg-fetch';

// add jest-axe matchers to expect
expect.extend(toHaveNoViolations);
