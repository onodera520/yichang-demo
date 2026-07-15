export const ORDER_TABLE_SETTINGS_VERSION = 2;

export function normalizeOrderTableSettings(saved, defaults) {
  if (
    !saved
    || saved.version !== ORDER_TABLE_SETTINGS_VERSION
    || !Array.isArray(saved.columns)
    || !Array.isArray(saved.hidden)
  ) {
    return defaults;
  }

  const validKeys = new Set(defaults.columns);
  const columns = saved.columns.filter((key) => validKeys.has(key));
  defaults.columns.forEach((key) => {
    if (!columns.includes(key)) columns.push(key);
  });

  return {
    columns,
    hidden: saved.hidden.filter((key) => validKeys.has(key)),
    density: saved.density === 'compact' ? 'compact' : 'standard',
  };
}
