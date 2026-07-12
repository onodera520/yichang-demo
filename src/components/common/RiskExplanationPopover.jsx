import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import RiskTag from './RiskTag.jsx';

export default function RiskExplanationPopover({ level, explanation, className = '', children }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (buttonRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    const closeOnViewportChange = () => setOpen(false);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 288;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(Math.max(12, rect.left), window.innerWidth - panelWidth - 12),
      });
    }
    setOpen((current) => !current);
  };

  if (!explanation) return children || <RiskTag type={level}>{level}</RiskTag>;

  return (
    <>
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-label={`查看${level}风险评分说明`}
        className={`inline-flex items-center gap-1 ${className}`}
        onClick={(event) => {
          event.stopPropagation();
          toggle();
        }}
        type="button"
      >
        {children || <RiskTag type={level}>{level}</RiskTag>}
        <Info className="h-3.5 w-3.5 text-[#8A98B3]" />
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[70] w-72 rounded-[10px] border border-[#DDE4EE] bg-white p-4 text-left shadow-[0_14px_40px_rgba(24,39,75,0.18)]"
              style={position}
            >
              <div className="mb-3 flex items-end justify-between">
                <span className="text-sm font-semibold text-[#1D273B]">风险评分</span>
                <span className="text-xl font-semibold text-[#2F7BFF]">{explanation.score}/100</span>
              </div>
              <div className="space-y-2.5">
                {explanation.factors.map((factor) => (
                  <div key={`${factor.label}-${factor.score}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#344767]">{factor.label}</span>
                      <span className={factor.score >= 0 ? 'font-semibold text-[#F04438]' : 'font-semibold text-[#159455]'}>
                        {factor.score >= 0 ? '+' : ''}{factor.score}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] leading-4 text-[#8A98B3]">{factor.detail}</div>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
