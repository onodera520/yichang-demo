function toFilterOption(option) {
  if (typeof option === 'string') {
    return { label: option, value: option };
  }

  return {
    label: option.label,
    value: option.value,
  };
}

export function normalizeFilterOptions(
  options = [],
  {
    includePlaceholder = true,
    placeholder = '全部',
    placeholderValue = '',
  } = {},
) {
  const normalizedOptions = options.map(toFilterOption);

  if (
    includePlaceholder &&
    !normalizedOptions.some((option) => option.value === placeholderValue)
  ) {
    return [{ label: placeholder, value: placeholderValue }, ...normalizedOptions];
  }

  return normalizedOptions;
}

export function getSelectedFilterLabel(options, value, fallback) {
  return options.find((option) => option.value === value)?.label ?? fallback;
}
