import React from 'react';

const platformStyles = {
  Amazon: {
    className: 'bg-[#111827] text-white',
    mark: 'a',
    label: 'Amazon',
    accent: '#F59E0B',
  },
  'TikTok Shop': {
    className: 'bg-[#101010] text-white',
    mark: 'T',
    label: 'TikTok Shop',
    accent: '#25F4EE',
  },
  Shopee: {
    className: 'bg-[#EE4D2D] text-white',
    mark: 'S',
    label: 'Shopee',
    accent: '#FFFFFF',
  },
  eBay: {
    className: 'bg-white text-[#344767] border border-[#E6EAF2]',
    mark: 'e',
    label: 'eBay',
    accent: '#86B817',
  },
  Shopify: {
    className: 'bg-[#EAF8F0] text-[#1F7A3A]',
    mark: 'S',
    label: 'Shopify',
    accent: '#95BF47',
  },
};

export default function PlatformLogo({ platform, showName = true, size = 'md', className = '' }) {
  const config = platformStyles[platform] ?? {
    className: 'bg-[#F2F6FC] text-[#344767]',
    mark: platform?.slice(0, 1) ?? '?',
    label: platform ?? 'Unknown',
    accent: '#2F7BFF',
  };
  const dimensions = size === 'sm' ? 'h-7' : 'h-8';
  const markSize = size === 'sm' ? 'h-5 w-5 text-[11px]' : 'h-6 w-6 text-xs';

  return (
    <span className={`inline-flex ${dimensions} items-center gap-2 rounded-[9px] px-2.5 ${config.className} ${className}`}>
      <span className={`relative flex ${markSize} items-center justify-center rounded-md bg-white/18 font-bold`}>
        {config.mark}
        <span
          className="absolute -bottom-0.5 h-1 w-3 rounded-full"
          style={{ backgroundColor: config.accent }}
        />
      </span>
      {showName ? <span className="text-xs font-medium">{config.label}</span> : null}
    </span>
  );
}
