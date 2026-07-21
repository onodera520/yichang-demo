import React from 'react';
import { ChevronRight } from 'lucide-react';
import RiskTag from '../../components/common/RiskTag.jsx';

export default function SuggestionDrawerContent({ suggestions, onSuggestionClick }) {
  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          className="block w-full rounded-[8px] border border-[#E3E9F3] bg-white p-4 text-left transition-colors hover:border-[#BFD5FF] hover:bg-[#F9FBFF]"
          onClick={() => onSuggestionClick(suggestion)}
          type="button"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <RiskTag
                  type={suggestion.riskLevel}
                  className="h-6 min-w-[36px] px-2 text-xs"
                />
                <span className="truncate text-[15px] font-semibold text-[#1D273B]">{suggestion.title}</span>
              </div>
              <div className="mt-2 truncate text-xs text-[#8A98B3]">
                {suggestion.sourceType} · {suggestion.source}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-[#8A98B3]">AI置信度</div>
              <div className="mt-0.5 text-sm font-semibold text-[#2F7BFF]">
                {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-[#5F6B7A]">{suggestion.description}</p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EDF1F7] pt-3">
            <span className="min-w-0 truncate text-xs text-[#344767]">{suggestion.impact}</span>
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-[#2F7BFF]">
              查看详情
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
