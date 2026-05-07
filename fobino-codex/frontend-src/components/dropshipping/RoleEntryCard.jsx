
// import React from 'react';
// import { CheckCircleFilled, RightOutlined, SafetyOutlined, ShopOutlined, AuditOutlined } from '@ant-design/icons';

// function getRoleIcon(role) {
//   if (role === 'provider') return <ShopOutlined />;
//   if (role === 'dropshipper') return <SafetyOutlined />;
//   return <AuditOutlined />;
// }

// const RoleEntryCard = ({
//   role,
//   title,
//   description,
//   approved,
//   statusText,
//   primaryActionLabel,
//   secondaryActionLabel,
//   onPrimaryAction,
//   onSecondaryAction,
//   badge,
//   stats = []
// }) => {
//   return (
//     <div className={`dropshipping-role-card ${approved ? 'is-approved' : ''}`}>
//       <div className="dropshipping-role-card__header">
//         <div className="dropshipping-role-card__icon">{getRoleIcon(role)}</div>
//         <div className="dropshipping-role-card__status-wrap">
//           <div className="dropshipping-role-card__badge">{badge}</div>
//           <div className={`dropshipping-role-card__status ${approved ? 'approved' : 'pending'}`}>
//             {approved ? <CheckCircleFilled /> : <AuditOutlined />}
//             <span>{statusText}</span>
//           </div>
//         </div>
//       </div>

//       <div className="dropshipping-role-card__body">
//         <h2 className="dropshipping-role-card__title">{title}</h2>
//         <p className="dropshipping-role-card__description">{description}</p>

//         {!!stats.length && (
//           <div className="dropshipping-role-card__stats">
//             {stats.map((item) => (
//               <div key={item.label} className="dropshipping-role-card__stat-item">
//                 <div className="dropshipping-role-card__stat-value">{item.value}</div>
//                 <div className="dropshipping-role-card__stat-label">{item.label}</div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="dropshipping-role-card__footer">
//         <button type="button" className="dropshipping-primary-btn full-width" onClick={onPrimaryAction}>
//           <span>{primaryActionLabel}</span>
//           <RightOutlined />
//         </button>

//         {secondaryActionLabel ? (
//           <button type="button" className="dropshipping-secondary-btn full-width" onClick={onSecondaryAction}>
//             {secondaryActionLabel}
//           </button>
//         ) : null}
//       </div>
//     </div>
//   );
// };

// export default RoleEntryCard;




/* frontend/my-app/src/components/dropshipping/RoleEntryCard.jsx */

import React from 'react';

// Custom Icons as SVG components
const ShopOutlined = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <path d="M3 10h18" />
    <path d="M12 12v4" />
    <path d="M8 14h8" />
  </svg>
);

const SafetyOutlined = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const AuditOutlined = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CheckCircleFilled = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const RightOutlined = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

function getRoleIcon(role) {
  if (role === 'provider') return <ShopOutlined />;
  if (role === 'dropshipper') return <SafetyOutlined />;
  return <AuditOutlined />;
}

const RoleEntryCard = ({
  role,
  title,
  description,
  approved,
  statusText,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  badge,
  stats = []
}) => {
  return (
    <div className={`dropshipping-role-card ${approved ? 'is-approved' : ''}`}>
      <div className="dropshipping-role-card__header">
        <div className="dropshipping-role-card__icon">{getRoleIcon(role)}</div>
        <div className="dropshipping-role-card__status-wrap">
          <div className="dropshipping-role-card__badge">{badge}</div>
          <div className={`dropshipping-role-card__status ${approved ? 'approved' : 'pending'}`}>
            {approved ? <CheckCircleFilled /> : <AuditOutlined />}
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      <div className="dropshipping-role-card__body">
        <h2 className="dropshipping-role-card__title">{title}</h2>
        <p className="dropshipping-role-card__description">{description}</p>

        {!!stats.length && (
          <div className="dropshipping-role-card__stats">
            {stats.map((item) => (
              <div key={item.label} className="dropshipping-role-card__stat-item">
                <div className="dropshipping-role-card__stat-value">{item.value}</div>
                <div className="dropshipping-role-card__stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dropshipping-role-card__footer">
        <button type="button" className="dropshipping-primary-btn full-width" onClick={onPrimaryAction}>
          <span>{primaryActionLabel}</span>
          <RightOutlined />
        </button>

        {secondaryActionLabel ? (
          <button type="button" className="dropshipping-secondary-btn full-width" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>

      <style>{`
        .dropshipping-role-card {
          background: #fff;
          border-radius: 22px;
          border: 1px solid #edf1f7;
          padding: 22px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          gap: 18px;
          transition: all 0.3s ease;
        }

        .dropshipping-role-card.is-approved {
          border-color: rgba(27, 94, 32, 0.16);
          box-shadow: 0 16px 38px rgba(20, 120, 50, 0.08);
        }

        .dropshipping-role-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .dropshipping-role-card__icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, #0d1b4c 0%, #183b8c 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .dropshipping-role-card__badge {
          background: #f4f7fc;
          color: #102766;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .dropshipping-role-card__status-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .dropshipping-role-card__status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
        }

        .dropshipping-role-card__status.approved {
          color: #1b5e20;
        }

        .dropshipping-role-card__status.pending {
          color: #8a5a00;
        }

        .dropshipping-role-card__title {
          margin: 0;
          font-size: 21px;
          color: #102766;
        }

        .dropshipping-role-card__description {
          margin: 8px 0 0;
          color: #5f6b7a;
          line-height: 2;
          font-size: 14px;
        }

        .dropshipping-role-card__stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .dropshipping-role-card__stat-item {
          border-radius: 16px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          text-align: center;
        }

        .dropshipping-role-card__stat-value {
          color: #102766;
          font-size: 20px;
          font-weight: 800;
        }

        .dropshipping-role-card__stat-label {
          color: #687385;
          font-size: 12px;
          margin-top: 6px;
        }

        .dropshipping-role-card__footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: auto;
        }

        .full-width {
          width: 100%;
        }

        .dropshipping-primary-btn,
        .dropshipping-secondary-btn {
          border: none;
          outline: none;
          cursor: pointer;
          border-radius: 14px;
          min-height: 48px;
          padding: 0 18px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .dropshipping-primary-btn {
          background: #102766;
          color: #fff;
        }

        .dropshipping-primary-btn:hover {
          background: #183b8c;
          transform: translateY(-1px);
        }

        .dropshipping-secondary-btn {
          background: #f4f7fc;
          color: #102766;
        }

        .dropshipping-secondary-btn:hover {
          background: #eef2f7;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .dropshipping-role-card {
            padding: 18px;
          }

          .dropshipping-role-card__stats {
            grid-template-columns: 1fr;
          }

          .dropshipping-role-card__title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default RoleEntryCard;