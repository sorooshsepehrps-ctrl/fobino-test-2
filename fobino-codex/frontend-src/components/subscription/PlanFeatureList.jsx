import { Check } from 'lucide-react';

export default function PlanFeatureList({ features = [] }) {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-sm leading-6">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-800" />
          <span className="text-slate-600">{feature}</span>
        </li>
      ))}
    </ul>
  );
}
