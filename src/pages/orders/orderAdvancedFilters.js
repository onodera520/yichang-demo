export const advancedFilterDefaults = {
  status: '',
  amountMin: '',
  amountMax: '',
  confidenceMin: '',
  confidenceMax: '',
  relatedSku: '',
};

function hasValue(value) {
  return value !== '' && value != null;
}

function optionalNumber(value) {
  if (!hasValue(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function matchesOrderAdvancedFilters(order, filters = advancedFilterDefaults) {
  const amountMin = optionalNumber(filters.amountMin);
  const amountMax = optionalNumber(filters.amountMax);
  const confidenceMin = optionalNumber(filters.confidenceMin);
  const confidenceMax = optionalNumber(filters.confidenceMax);
  const confidencePercent = Number(order.confidence) * 100;

  return (
    (!filters.status || order.status === filters.status)
    && (amountMin == null || Number(order.amount) >= amountMin)
    && (amountMax == null || Number(order.amount) <= amountMax)
    && (confidenceMin == null || confidencePercent >= confidenceMin)
    && (confidenceMax == null || confidencePercent <= confidenceMax)
    && (!filters.relatedSku || order.relatedSku === filters.relatedSku)
  );
}

export function getOrderAdvancedFilterErrors(filters = advancedFilterDefaults) {
  const amountMin = optionalNumber(filters.amountMin);
  const amountMax = optionalNumber(filters.amountMax);
  const confidenceMin = optionalNumber(filters.confidenceMin);
  const confidenceMax = optionalNumber(filters.confidenceMax);
  let amount = '';
  let confidence = '';

  if (
    (hasValue(filters.amountMin) && amountMin == null)
    || (hasValue(filters.amountMax) && amountMax == null)
  ) {
    amount = '请输入有效金额';
  } else if ((amountMin != null && amountMin < 0) || (amountMax != null && amountMax < 0)) {
    amount = '金额不能小于 0';
  } else if (amountMin != null && amountMax != null && amountMin > amountMax) {
    amount = '最小金额不能大于最大金额';
  }

  if (
    (hasValue(filters.confidenceMin) && confidenceMin == null)
    || (hasValue(filters.confidenceMax) && confidenceMax == null)
  ) {
    confidence = '请输入有效置信度';
  } else if (
    (confidenceMin != null && (confidenceMin < 0 || confidenceMin > 100))
    || (confidenceMax != null && (confidenceMax < 0 || confidenceMax > 100))
  ) {
    confidence = '置信度需在 0–100% 之间';
  } else if (confidenceMin != null && confidenceMax != null && confidenceMin > confidenceMax) {
    confidence = '最小置信度不能大于最大置信度';
  }

  return { amount, confidence };
}

export function countActiveOrderAdvancedFilters(filters = advancedFilterDefaults) {
  return [
    Boolean(filters.status),
    hasValue(filters.amountMin) || hasValue(filters.amountMax),
    hasValue(filters.confidenceMin) || hasValue(filters.confidenceMax),
    Boolean(filters.relatedSku),
  ].filter(Boolean).length;
}
