import { useEffect, useState, RefObject } from 'react';

interface UseScrollStateReturn {
  isScrollable: boolean;
  isAtBottom: boolean;
}

/**
 * Custom hook to track if a scrollable container is scrollable and if it's at the bottom.
 * @param ref - Reference to the scrollable element
 * @param dependency - Dependency array value (e.g., list data) to retrigger checks
 * @returns Object containing isScrollable and isAtBottom states
 */
export const useScrollState = (
  ref: RefObject<HTMLElement | null>,
  dependency: unknown,
): UseScrollStateReturn => {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    console.log('scrollable?', isScrollable);
    console.log('is at bottom?:', isAtBottom);
  }, [isScrollable, isAtBottom]);

  useEffect(() => {
    const checkScrollable = () => {
      if (ref.current) {
        const { scrollHeight, clientHeight, scrollTop } = ref.current;
        setIsScrollable(scrollHeight > clientHeight);
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight);
      }
    };

    checkScrollable();

    const resizeObserver = new ResizeObserver(() => {
      checkScrollable();
    });

    const listElement = ref.current;
    if (listElement) {
      resizeObserver.observe(listElement);
      listElement.addEventListener('scroll', checkScrollable);
    }
    window.addEventListener('resize', checkScrollable);

    return () => {
      resizeObserver.disconnect();
      if (listElement) {
        listElement.removeEventListener('scroll', checkScrollable);
      }
      window.removeEventListener('resize', checkScrollable);
    };
  }, [ref, dependency]);

  return { isScrollable, isAtBottom };
};
