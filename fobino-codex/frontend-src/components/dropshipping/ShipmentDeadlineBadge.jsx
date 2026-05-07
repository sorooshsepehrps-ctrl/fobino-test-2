
import React from 'react';

const lateStatuses = [
  'shipment_deadline_passed',
  'late_ticket_created',
  'provider_suspended_due_to_no_tracking',
  'refunded_due_to_no_tracking'
];

export default function ShipmentDeadlineBadge({ rfp, compact = false }) {
  const isLate = lateStatuses.includes(rfp?.status) || rfp?.lateFlow?.isLate;
  const text = isLate
    ? 'تاخیر در ارسال'
    : rfp?.agreedShipmentDateJalali
      ? `ارسال: ${rfp.agreedShipmentDateJalali}`
      : 'تاریخ ارسال نامشخص';

  return <span className={compact ? 'deadline-badge compact' : 'deadline-badge'}>{text}</span>;
}
