import React, { createContext, useContext, useMemo, useState } from 'react';

const TopbarFilterContext = createContext(null);

const defaultFilters = {
  platform: '',
  store: '',
  keyword: '',
};

export function TopbarFilterProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);

  const value = useMemo(
    () => ({
      ...filters,
      setPlatform: (platform) => {
        setFilters((current) => ({ ...current, platform, store: '' }));
      },
      setStore: (store) => {
        setFilters((current) => ({ ...current, store }));
      },
      setKeyword: (keyword) => {
        setFilters((current) => ({ ...current, keyword }));
      },
      resetTopbarFilters: () => {
        setFilters(defaultFilters);
      },
    }),
    [filters],
  );

  return <TopbarFilterContext.Provider value={value}>{children}</TopbarFilterContext.Provider>;
}

export function useTopbarFilter() {
  const context = useContext(TopbarFilterContext);
  if (!context) {
    throw new Error('useTopbarFilter must be used within TopbarFilterProvider');
  }
  return context;
}
