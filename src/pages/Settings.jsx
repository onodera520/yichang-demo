import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import PlaceholderPanel from '../components/PlaceholderPanel.jsx';

export default function Settings() {
  return (
    <>
      <PageHeader title="系统设置" />
      <PlaceholderPanel title="系统设置内容占位">
        <div className="text-sm text-[#8A98B3]">页面内容将在下一步按 reference 高保真还原。</div>
      </PlaceholderPanel>
    </>
  );
}
