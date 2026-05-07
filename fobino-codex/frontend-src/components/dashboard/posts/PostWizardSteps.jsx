import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export default function PostWizardSteps({
  steps = [],
  currentStep = 0,
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.22)] md:p-5">
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;

          return (
            <div
              key={step.key}
              className={clsx(
                'rounded-[24px] border p-4 transition',
                isActive
                  ? 'border-blue-200 bg-blue-50'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    مرحله {Number(index + 1).toLocaleString('fa-IR')}
                  </p>
                  <h3 className="mt-2 text-sm font-black text-slate-900 md:text-base">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    {step.description}
                  </p>
                </div>

                <div
                  className={clsx(
                    'inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-500'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : Number(index + 1).toLocaleString('fa-IR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}