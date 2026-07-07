import { useEffect, useRef, useState } from 'react';

export function useSlaClock() {
  const anchorMsRef = useRef(Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return {
    anchorMs: anchorMsRef.current,
    nowMs,
  };
}
