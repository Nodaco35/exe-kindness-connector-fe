'use client';

import { useLayoutEffect, useState } from 'react';

export function useWindowSize(width: number, isLess = false) {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      setMatches(isLess ? window.innerWidth < width : window.innerWidth > width);
    };

    window.addEventListener('resize', update);
    update();

    return () => window.removeEventListener('resize', update);
  }, [width, isLess]);

  return matches;
}

export const useIsXL = () => useWindowSize(1600);
export const useIsDesktop = () => useWindowSize(1200);
export const useIsLaptop = () => useWindowSize(1507, true);
export const useIsTablet = () => useWindowSize(991, true);
export const useIsMobile = () => useWindowSize(768, true);
