import { Star } from 'lucide-react';
export default function RatingStarsInput({ value = 0, onChange }) {
  return <div className="flex items-center gap-1" dir="ltr">{[1,2,3,4,5].map(i => <button key={i} type="button" onClick={() => onChange?.(i)} className="p-1"><Star className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} /></button>)}</div>;
}
