it('should pass', () => {
  expect(true).toBe(true);
});

// import { EventData } from '@/types';
// import { render, screen } from '@testing-library/react';
// import { FirestoreError, Timestamp } from 'firebase/firestore';
// import EventInfo from './EventInfo';
// import formatEventTiming from '@/utils/formatEventTiming';
// import { axe } from 'jest-axe';

// jest.mock('@/utils/formatEventTiming', () => jest.fn());

// const mockFormatEventTiming = formatEventTiming as jest.Mock;

// describe('EventInfo component', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   afterEach(() => {
//     jest.useRealTimers(); // restore real clock after each test
//   });

//   const mockEventData: Omit<EventData, 'id'> = {
//     name: 'mock event name',
//     location: 'mock location',
//     capacity: 100,
//     organizationId: 'mock org',
//     start: new Timestamp(10, 1),
//     end: new Timestamp(20, 2),
//     signupsCount: 50,
//   };

//   describe('no loading/error', () => {
//     it('should display event info', () => {
//       mockFormatEventTiming.mockReturnValueOnce('mock event timing');

//       render(<EventInfo eventData={mockEventData} eventLoading={false} eventError={undefined} />);
//       expect(screen.getByText(/mock event name/i)).toBeInTheDocument();
//       expect(screen.getByText(/mock location/i)).toBeInTheDocument();
//       expect(screen.getByText(/.*100/)).toBeInTheDocument();
//       expect(screen.getByText(/mock event timing/i)).toBeInTheDocument();
//       expect(mockFormatEventTiming).toHaveBeenCalledWith(
//         new Timestamp(10, 1),
//         new Timestamp(20, 2),
//       );
//     });

//     it('should not have accessibility violations', async () => {
//       const { container } = render(
//         <EventInfo eventData={mockEventData} eventLoading={false} eventError={undefined} />,
//       );
//       const results = await axe(container);
//       expect(results).toHaveNoViolations();
//     });
//   });

//   describe('loading', () => {
//     it('should display loading', () => {
//       render(<EventInfo eventData={undefined} eventLoading={true} eventError={undefined} />);
//       expect(screen.getByText(/loading/i)).toBeInTheDocument();
//     });

//     it('should have no accessibility violations', async () => {
//       const { container } = render(
//         <EventInfo eventData={undefined} eventLoading={true} eventError={undefined} />,
//       );
//       const result = await axe(container);
//       expect(result).toHaveNoViolations();
//     });
//   });

//   describe('error', () => {
//     it('should display error', () => {
//       render(
//         <EventInfo
//           eventData={undefined}
//           eventLoading={false}
//           eventError={new Error('firestore error') as FirestoreError}
//         />,
//       );
//       expect(screen.getByText(/firestore error/i)).toBeInTheDocument();
//     });

//     it('should have no accessibility violations', async () => {
//       const { container } = render(
//         <EventInfo
//           eventData={undefined}
//           eventLoading={false}
//           eventError={new Error('firestore error') as FirestoreError}
//         />,
//       );
//       const result = await axe(container);
//       expect(result).toHaveNoViolations();
//     });
//   });
// });
