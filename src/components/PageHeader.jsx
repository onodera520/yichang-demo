import React from 'react';

export default function PageHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h1 className="text-[22px] font-semibold leading-8 text-[#1D273B]">{title}</h1>
      {description ? <p className="mt-1 text-sm text-[#7889A8]">{description}</p> : null}
    </div>
  );
}
