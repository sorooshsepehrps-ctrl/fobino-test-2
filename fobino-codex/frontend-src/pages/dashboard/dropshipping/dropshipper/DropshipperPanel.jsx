// /* frontend/my-app/src/pages/dashboard/dropshipping/dropshipper/DropshipperPanel.jsx */

// import React, { useEffect, useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { message } from 'antd';
// import { FiArrowRight, FiBox, FiCheckCircle, FiCreditCard, FiClock } from 'react-icons/fi';
// import { getDropshipperDashboardSummary, getMyRFPs } from '../../../../services/dropshippingService';
// import DropshipperSummaryCards from '../../../../components/dropshipping/DropshipperSummaryCards';
// import RFPCard from '../../../../components/dropshipping/RFPCard';

// const quickLinks = [
//   {
//     title: 'محصولات',
//     description: 'محصولات فعال دراپ‌شیپینگ را ببین و برای آن‌ها RFP ثبت کن.',
//     to: '/dashboard/dropshipping/dropshipper/products',
//     icon: <FiBox />
//   },
//   {
//     title: 'محصولات پذیرفته‌شده',
//     description: 'محصولاتی که روی آن‌ها RFP ثبت کرده‌ای را مدیریت کن.',
//     to: '/dashboard/dropshipping/dropshipper/accepted-products',
//     icon: <FiCheckCircle />
//   },
//   {
//     title: 'مالی',
//     description: 'پرداخت‌ها، مبالغ بلوکه‌شده و بازگشت وجه‌ها را بررسی کن.',
//     to: '/dashboard/dropshipping/dropshipper/finance',
//     icon: <FiCreditCard />
//   }
// ];

// export default function DropshipperPanel() {
//   const [summary, setSummary] = useState(null);
//   const [recentRfps, setRecentRfps] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;

//     const load = async () => {
//       try {
//         setLoading(true);
//         const [summaryRes, rfpsRes] = await Promise.all([
//           getDropshipperDashboardSummary(),
//           getMyRFPs({ role: 'dropshipper', limit: 5 })
//         ]);

//         if (!mounted) return;
//         setSummary(summaryRes?.data || summaryRes || null);
//         setRecentRfps(rfpsRes?.data || []);
//       } catch (err) {
//         console.error(err);
//         message.error('دریافت اطلاعات پنل دراپ‌شیپر با مشکل مواجه شد');
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     load();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const hasActivity = useMemo(() => recentRfps.length > 0, [recentRfps]);

//   return (
//     <div className="dropshipping-page dropshipper-panel-page">
//       <div className="page-header-card">
//         <div>
//           <h1>پنل دراپ‌شیپر</h1>
//           <p>محصولات مناسب را پیدا کن، RFP ثبت کن، سفارش‌ها را پیگیری کن و وضعیت مالی را شفاف ببین.</p>
//         </div>
//       </div>

//       <DropshipperSummaryCards summary={summary} loading={loading} />

//       <section className="dropshipping-grid three-up mt-24">
//         {quickLinks.map((item) => (
//           <Link key={item.to} to={item.to} className="ds-action-card">
//             <div className="ds-action-card__icon">{item.icon}</div>
//             <div className="ds-action-card__content">
//               <h3>{item.title}</h3>
//               <p>{item.description}</p>
//             </div>
//             <span className="ds-action-card__arrow">
//               <FiArrowRight />
//             </span>
//           </Link>
//         ))}
//       </section>

//       <section className="page-section mt-24">
//         <div className="section-header">
//           <div>
//             <h2>RFP های اخیر</h2>
//             <p>آخرین درخواست‌ها و سفارش‌های در حال پیگیری تو.</p>
//           </div>
//           <Link to="/dashboard/dropshipping/dropshipper/accepted-products" className="section-link">
//             مشاهده همه
//           </Link>
//         </div>

//         {loading ? (
//           <div className="rfp-list-skeleton">در حال بارگذاری...</div>
//         ) : hasActivity ? (
//           <div className="rfp-list">
//             {recentRfps.map((rfp) => (
//               <RFPCard
//                 key={rfp._id}
//                 rfp={rfp}
//                 viewerRole="dropshipper"
//                 detailUrl={`/dashboard/dropshipping/dropshipper/rfps/${rfp._id}`}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className="ds-empty-state">
//             <div className="ds-empty-state__icon">
//               <FiClock />
//             </div>
//             <h3>هنوز فعالیتی ثبت نشده</h3>
//             <p>برای شروع، از لیست محصولات یک محصول مناسب انتخاب کن و اولین RFP را ثبت کن.</p>
//             <Link className="primary-btn" to="/dashboard/dropshipping/dropshipper/products">
//               مشاهده محصولات
//             </Link>
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }



/* frontend/my-app/src/pages/dashboard/dropshipping/dropshipper/DropshipperPanel.jsx */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBox, FiCheckCircle, FiCreditCard, FiClock } from 'react-icons/fi';
import dropshippingService from '../../../../services/dropshippingService';
import DropshipperSummaryCards from '../../../../components/dropshipping/DropshipperSummaryCards';
import RFPCard from '../../../../components/dropshipping/RFPCard';

const quickLinks = [
  {
    title: 'محصولات',
    description: 'محصولات فعال دراپ‌شیپینگ را ببین و برای آن‌ها RFP ثبت کن.',
    to: '/dashboard/dropshipping/dropshipper/products',
    icon: <FiBox />
  },
  {
    title: 'محصولات پذیرفته‌شده',
    description: 'محصولاتی که روی آن‌ها RFP ثبت کرده‌ای را مدیریت کن.',
    to: '/dashboard/dropshipping/dropshipper/accepted-products',
    icon: <FiCheckCircle />
  },
  {
    title: 'مالی',
    description: 'پرداخت‌ها، مبالغ بلوکه‌شده و بازگشت وجه‌ها را بررسی کن.',
    to: '/dashboard/dropshipping/dropshipper/finance',
    icon: <FiCreditCard />
  }
];

export default function DropshipperPanel() {
  const [summary, setSummary] = useState(null);
  const [recentRfps, setRecentRfps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [summaryRes, rfpsRes] = await Promise.all([
          dropshippingService.getDropshipperDashboardSummary(),
          dropshippingService.getMyRFPs({ role: 'dropshipper', limit: 5 })
        ]);

        if (!mounted) return;
        setSummary(summaryRes?.data || summaryRes || null);
        setRecentRfps(rfpsRes?.data || []);
      } catch (err) {
        console.error('Error loading dropshipper panel:', err);
        alert('دریافت اطلاعات پنل دراپ‌شیپر با مشکل مواجه شد');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const hasActivity = useMemo(() => recentRfps.length > 0, [recentRfps]);

  const pageStyles = `
    .dropshipping-page {
      padding: 24px;
      direction: rtl;
    }

    .page-header-card {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #eef2f7;
    }

    .page-header-card h1 {
      margin: 0 0 8px;
      font-size: 28px;
      color: #102766;
    }

    .page-header-card p {
      margin: 0;
      color: #5f6b7a;
      font-size: 14px;
    }

    .mt-24 {
      margin-top: 24px;
    }

    .dropshipping-grid {
      display: grid;
      gap: 20px;
    }

    .three-up {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .ds-action-card {
      background: #fff;
      border: 1px solid #edf1f7;
      border-radius: 20px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;
      text-decoration: none;
      cursor: pointer;
    }

    .ds-action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.1);
      border-color: #102766;
    }

    .ds-action-card__icon {
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 16px;
      background: linear-gradient(135deg, #0d1b4c 0%, #183b8c 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .ds-action-card__content {
      flex: 1;
    }

    .ds-action-card__content h3 {
      margin: 0 0 4px;
      font-size: 16px;
      color: #102766;
    }

    .ds-action-card__content p {
      margin: 0;
      font-size: 13px;
      color: #5f6b7a;
    }

    .ds-action-card__arrow {
      color: #102766;
      font-size: 20px;
    }

    .page-section {
      margin-top: 32px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
    }

    .section-header h2 {
      margin: 0 0 4px;
      font-size: 20px;
      color: #102766;
    }

    .section-header p {
      margin: 0;
      font-size: 13px;
      color: #5f6b7a;
    }

    .section-link {
      color: #102766;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }

    .section-link:hover {
      text-decoration: underline;
    }

    .rfp-list-skeleton {
      background: #f8fafc;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      color: #5f6b7a;
    }

    .rfp-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ds-empty-state {
      background: #f8fafc;
      border-radius: 20px;
      padding: 48px 24px;
      text-align: center;
      border: 1px solid #eef2f7;
    }

    .ds-empty-state__icon {
      font-size: 48px;
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .ds-empty-state h3 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #102766;
    }

    .ds-empty-state p {
      margin: 0 0 20px;
      color: #5f6b7a;
      font-size: 14px;
    }

    .primary-btn {
      display: inline-block;
      background: #102766;
      color: #fff;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .primary-btn:hover {
      background: #183b8c;
      transform: translateY(-1px);
    }

    @media (max-width: 992px) {
      .three-up {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dropshipping-page {
        padding: 16px;
      }

      .page-header-card h1 {
        font-size: 24px;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div className="dropshipping-page dropshipper-panel-page">
        <div className="page-header-card">
          <div>
            <h1>پنل دراپ‌شیپر</h1>
            <p>محصولات مناسب را پیدا کن، RFP ثبت کن، سفارش‌ها را پیگیری کن و وضعیت مالی را شفاف ببین.</p>
          </div>
        </div>

        <DropshipperSummaryCards summary={summary} loading={loading} />

        <section className="dropshipping-grid three-up">
          {quickLinks.map((item) => (
            <Link key={item.to} to={item.to} className="ds-action-card">
              <div className="ds-action-card__icon">{item.icon}</div>
              <div className="ds-action-card__content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className="ds-action-card__arrow">
                <FiArrowRight />
              </span>
            </Link>
          ))}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <h2>RFP های اخیر</h2>
              <p>آخرین درخواست‌ها و سفارش‌های در حال پیگیری تو.</p>
            </div>
            <Link to="/dashboard/dropshipping/dropshipper/accepted-products" className="section-link">
              مشاهده همه
            </Link>
          </div>

          {loading ? (
            <div className="rfp-list-skeleton">در حال بارگذاری...</div>
          ) : hasActivity ? (
            <div className="rfp-list">
              {recentRfps.map((rfp) => (
                <RFPCard
                  key={rfp._id}
                  rfp={rfp}
                  viewerRole="dropshipper"
                  detailUrl={`/dashboard/dropshipping/dropshipper/rfps/${rfp._id}`}
                />
              ))}
            </div>
          ) : (
            <div className="ds-empty-state">
              <div className="ds-empty-state__icon">
                <FiClock />
              </div>
              <h3>هنوز فعالیتی ثبت نشده</h3>
              <p>برای شروع، از لیست محصولات یک محصول مناسب انتخاب کن و اولین RFP را ثبت کن.</p>
              <Link className="primary-btn" to="/dashboard/dropshipping/dropshipper/products">
                مشاهده محصولات
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}





