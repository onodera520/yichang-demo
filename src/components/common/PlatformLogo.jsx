import React from 'react';
import amazonLogo from '../../assets/platform-logos/amazon.svg';
import ebayLogo from '../../assets/platform-logos/ebay.svg';
import shopeeLogo from '../../assets/platform-logos/shopee.svg';
import shopifyLogo from '../../assets/platform-logos/shopify.svg';
import tiktokShopLogo from '../../assets/platform-logos/tiktok-shop.svg';

const platformLogos = {
  Amazon: {
    src: amazonLogo,
    label: 'Amazon',
    wide: false,
  },
  'TikTok Shop': {
    src: tiktokShopLogo,
    label: 'TikTok Shop',
    wide: false,
  },
  Shopee: {
    src: shopeeLogo,
    label: 'Shopee',
    wide: false,
  },
  eBay: {
    src: ebayLogo,
    label: 'eBay',
    wide: true,
  },
  Shopify: {
    src: shopifyLogo,
    label: 'Shopify',
    wide: false,
  },
};

const sizeStyles = {
  sm: {
    wrapper: 'h-7',
    icon: 'h-6 w-6',
    wideIcon: 'h-6 w-12',
    fallback: 'h-6 w-6 text-[11px]',
  },
  md: {
    wrapper: 'h-8',
    icon: 'h-7 w-7',
    wideIcon: 'h-7 w-14',
    fallback: 'h-7 w-7 text-xs',
  },
  lg: {
    wrapper: 'h-10',
    icon: 'h-9 w-9',
    wideIcon: 'h-9 w-[72px]',
    fallback: 'h-9 w-9 text-sm',
  },
};

export default function PlatformLogo({ platform, showName = true, size = 'md', className = '' }) {
  const config = platformLogos[platform];
  const styles = sizeStyles[size] ?? sizeStyles.md;

  if (!config) {
    return (
      <span className={`inline-flex ${styles.wrapper} items-center gap-2 rounded-[9px] border border-[#E6EAF2] bg-[#F2F6FC] px-2.5 text-[#344767] ${className}`}>
        <span className={`flex ${styles.fallback} items-center justify-center rounded-md bg-white font-bold`}>
          {platform?.slice(0, 1) ?? '?'}
        </span>
        {showName ? <span className="text-xs font-medium">{platform ?? 'Unknown'}</span> : null}
      </span>
    );
  }

  const iconSize = config.wide ? styles.wideIcon : styles.icon;

  return (
    <span className={`inline-flex ${styles.wrapper} items-center gap-2 rounded-[9px] px-1.5 ${className}`}>
      <img
        alt={`${config.label} logo`}
        className={`${iconSize} shrink-0 object-contain`}
        draggable="false"
        src={config.src}
      />
      {showName ? <span className="text-xs font-medium text-[#1D273B]">{config.label}</span> : null}
    </span>
  );
}
