import assert from 'node:assert/strict';
import {
  getSelectedFilterLabel,
  normalizeFilterOptions,
} from './filterSelectOptions.js';

assert.deepEqual(
  normalizeFilterOptions(['Amazon', 'Shopee'], {
    includePlaceholder: true,
    placeholder: '全部平台',
    placeholderValue: '',
  }),
  [
    { label: '全部平台', value: '' },
    { label: 'Amazon', value: 'Amazon' },
    { label: 'Shopee', value: 'Shopee' },
  ],
);

assert.deepEqual(
  normalizeFilterOptions(
    [
      { label: '全部', value: '' },
      { label: '高风险', value: '高' },
    ],
    { includePlaceholder: true, placeholder: '全部', placeholderValue: '' },
  ),
  [
    { label: '全部', value: '' },
    { label: '高风险', value: '高' },
  ],
);

assert.deepEqual(
  normalizeFilterOptions(['全部', '待处理'], {
    includePlaceholder: false,
    placeholder: '全部',
    placeholderValue: '全部',
  }),
  [
    { label: '全部', value: '全部' },
    { label: '待处理', value: '待处理' },
  ],
);

const options = [
  { label: '全部仓库', value: '' },
  { label: 'LA 仓', value: 'LA' },
];

assert.equal(getSelectedFilterLabel(options, 'LA', '全部仓库'), 'LA 仓');
assert.equal(getSelectedFilterLabel(options, 'missing', '全部仓库'), '全部仓库');
