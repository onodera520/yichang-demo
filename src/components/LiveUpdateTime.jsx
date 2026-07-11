import React from 'react';
import { formatDateTime } from '../utils/time.js';

export default function LiveUpdateTime({ className = '', value }) {
  return <span className={className}>数据更新时间：{formatDateTime(value)}</span>;
}
