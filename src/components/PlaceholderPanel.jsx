import React from 'react';

export default function PlaceholderPanel({ title, children }) {
  return (
    <section className="panel min-h-[calc(100vh-124px)] p-5">
      <div className="mb-4 border-b border-[#E6EAF2] pb-4">
        <h2 className="text-base font-semibold text-[#1D273B]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
