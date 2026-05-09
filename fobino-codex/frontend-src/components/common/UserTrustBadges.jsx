import VipBadge from './VipBadge';
import ProducerBadge from './ProducerBadge';

export default function UserTrustBadges({ badges, compact = false, className = '' }) {
  const vip = badges?.vip;
  const producer = badges?.producer;

  if (!vip?.active && !producer?.active) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <VipBadge active={vip?.active} compact={compact} />
      <ProducerBadge
        active={producer?.active}
        level={producer?.verificationLevel}
        status={producer?.status}
        compact={compact}
      />
    </div>
  );
}
