
import React from 'react';

const PageSectionHeader = ({ title, subtitle, actions = null }) => {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
};

export default PageSectionHeader;
