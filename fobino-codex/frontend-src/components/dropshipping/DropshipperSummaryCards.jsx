
import React from 'react';
import { FiCheckCircle, FiClock, FiCreditCard } from 'react-icons/fi';

export default function DropshipperSummaryCards({ summary, loading }) {
  const cards = [
    {
      key: 'activeRfps',
      title: 'RFP فعال',
      value: summary?.activeRfps || 0,
      icon: <FiClock />
    },
    {
      key: 'completedRfps',
      title: 'RFP تکمیل‌شده',
      value: summary?.completedRfps || 0,
      icon: <FiCheckCircle />
    },
    {
      key: 'blockedAmount',
      title: 'مبلغ بلوکه‌شده',
      value: `${(summary?.blockedAmount || 0).toLocaleString('fa-IR')} تومان`,
      icon: <FiCreditCard />
    }
  ];

  return (
    <div className="summary-cards-grid mt-24">
      {cards.map((card) => (
        <div className="summary-card" key={card.key}>
          <div className="summary-card__icon">{card.icon}</div>
          <div>
            <span>{card.title}</span>
            <strong>{loading ? '...' : card.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
