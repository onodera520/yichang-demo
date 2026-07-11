import { useCallback, useState } from 'react';

export function useRefreshTime() {
  const [refreshTime, setRefreshTime] = useState(() => new Date());

  const refreshNow = useCallback(() => {
    const nextTime = new Date();
    setRefreshTime(nextTime);
    return nextTime;
  }, []);

  return { refreshTime, refreshNow };
}
