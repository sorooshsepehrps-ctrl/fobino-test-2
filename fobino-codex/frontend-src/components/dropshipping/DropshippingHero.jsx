
// import React from 'react';
// import { PlayCircleOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons';

// const featureList = [
//   {
//     icon: <SafetyCertificateOutlined />,
//     title: 'فرآیند امن و ساختاریافته',
//     description: 'از ایجاد RFP تا تسویه و ثبت امتیاز، همه‌چیز در یک جریان شفاف و کنترل‌شده انجام می‌شود.'
//   },
//   {
//     icon: <ThunderboltOutlined />,
//     title: 'مناسب برای اجرای حرفه‌ای',
//     description: 'تامین‌کننده و دراپ‌شیپر هرکدام پنل اختصاصی دارند و وضعیت سفارش‌ها به‌صورت دقیق قابل پیگیری است.'
//   },
//   {
//     icon: <PlayCircleOutlined />,
//     title: 'آموزش سریع شروع',
//     description: 'قبل از ورود به پنل، می‌توانید آموزش کوتاه سیستم را ببینید و با مسیر کلی کار آشنا شوید.'
//   }
// ];

// const DropshippingHero = ({ onOpenTutorial }) => {
//   return (
//     <div className="dropshipping-hero-card">
//       <div className="dropshipping-hero-card__content">
//         <div className="dropshipping-hero-card__eyebrow">سیستم دراپ‌شیپینگ فوبینو</div>
//         <h1 className="dropshipping-hero-card__title">ورود به فضای حرفه‌ای همکاری بین تامین‌کننده و دراپ‌شیپر</h1>
//         <p className="dropshipping-hero-card__description">
//           در این بخش می‌توانید نقش خود را فعال کنید، وارد پنل تخصصی شوید و جریان کامل محصولات،
//           RFPها، وضعیت‌ها و امور مالی را به‌شکل ساختاریافته مدیریت کنید.
//         </p>

//         <div className="dropshipping-hero-card__actions">
//           <button type="button" className="dropshipping-primary-btn" onClick={onOpenTutorial}>
//             مشاهده آموزش ویدئویی
//           </button>
//           <div className="dropshipping-hero-card__hint">پیشنهاد می‌شود قبل از شروع، آموزش کوتاه سیستم را ببینید.</div>
//         </div>
//       </div>

//       <div className="dropshipping-hero-card__features">
//         {featureList.map((item) => (
//           <div key={item.title} className="dropshipping-hero-feature">
//             <div className="dropshipping-hero-feature__icon">{item.icon}</div>
//             <div className="dropshipping-hero-feature__body">
//               <div className="dropshipping-hero-feature__title">{item.title}</div>
//               <div className="dropshipping-hero-feature__description">{item.description}</div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DropshippingHero;



/* frontend/my-app/src/components/dropshipping/DropshippingHero.jsx */

import React from 'react';

// Custom Icons as SVG components
const SafetyCertificateOutlined = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

const ThunderboltOutlined = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
  </svg>
);

const PlayCircleOutlined = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);

const featureList = [
  {
    icon: <SafetyCertificateOutlined />,
    title: 'فرآیند امن و ساختاریافته',
    description: 'از ایجاد RFP تا تسویه و ثبت امتیاز، همه‌چیز در یک جریان شفاف و کنترل‌شده انجام می‌شود.'
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'مناسب برای اجرای حرفه‌ای',
    description: 'تامین‌کننده و دراپ‌شیپر هرکدام پنل اختصاصی دارند و وضعیت سفارش‌ها به‌صورت دقیق قابل پیگیری است.'
  },
  {
    icon: <PlayCircleOutlined />,
    title: 'آموزش سریع شروع',
    description: 'قبل از ورود به پنل، می‌توانید آموزش کوتاه سیستم را ببینید و با مسیر کلی کار آشنا شوید.'
  }
];

const DropshippingHero = ({ onOpenTutorial }) => {
  return (
    <div className="dropshipping-hero-card">
      <div className="dropshipping-hero-card__content">
        <div className="dropshipping-hero-card__eyebrow">سیستم دراپ‌شیپینگ فوبینو</div>
        <h1 className="dropshipping-hero-card__title">ورود به فضای حرفه‌ای همکاری بین تامین‌کننده و دراپ‌شیپر</h1>
        <p className="dropshipping-hero-card__description">
          در این بخش می‌توانید نقش خود را فعال کنید، وارد پنل تخصصی شوید و جریان کامل محصولات،
          RFPها، وضعیت‌ها و امور مالی را به‌شکل ساختاریافته مدیریت کنید.
        </p>

        <div className="dropshipping-hero-card__actions">
          <button type="button" className="dropshipping-primary-btn" onClick={onOpenTutorial}>
            مشاهده آموزش ویدئویی
          </button>
          <div className="dropshipping-hero-card__hint">پیشنهاد می‌شود قبل از شروع، آموزش کوتاه سیستم را ببینید.</div>
        </div>
      </div>

      <div className="dropshipping-hero-card__features">
        {featureList.map((item) => (
          <div key={item.title} className="dropshipping-hero-feature">
            <div className="dropshipping-hero-feature__icon">{item.icon}</div>
            <div className="dropshipping-hero-feature__body">
              <div className="dropshipping-hero-feature__title">{item.title}</div>
              <div className="dropshipping-hero-feature__description">{item.description}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .dropshipping-hero-card {
          background: linear-gradient(135deg, #0d1b4c 0%, #102766 52%, #183b8c 100%);
          color: #fff;
          border-radius: 24px;
          padding: 28px;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
          gap: 24px;
          box-shadow: 0 22px 48px rgba(16, 39, 102, 0.2);
        }

        .dropshipping-hero-card__content {
          display: flex;
          flex-direction: column;
        }

        .dropshipping-hero-card__eyebrow {
          font-size: 13px;
          opacity: 0.9;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }

        .dropshipping-hero-card__title {
          margin: 0 0 14px;
          font-size: 30px;
          line-height: 1.5;
          font-weight: 800;
        }

        .dropshipping-hero-card__description {
          margin: 0;
          font-size: 15px;
          line-height: 2;
          color: rgba(255,255,255,0.9);
        }

        .dropshipping-hero-card__actions {
          margin-top: 20px;
        }

        .dropshipping-hero-card__hint {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }

        .dropshipping-primary-btn {
          border: none;
          outline: none;
          cursor: pointer;
          border-radius: 14px;
          min-height: 48px;
          padding: 0 24px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s ease;
          background: #fff;
          color: #102766;
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }

        .dropshipping-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(0,0,0,0.16);
        }

        .dropshipping-hero-card__features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .dropshipping-hero-feature {
          display: flex;
          gap: 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 16px;
          backdrop-filter: blur(8px);
        }

        .dropshipping-hero-feature__icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 14px;
          background: rgba(255,255,255,0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .dropshipping-hero-feature__title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .dropshipping-hero-feature__description {
          font-size: 13px;
          line-height: 1.9;
          color: rgba(255,255,255,0.88);
        }

        @media (max-width: 992px) {
          .dropshipping-hero-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dropshipping-hero-card {
            padding: 20px;
          }

          .dropshipping-hero-card__title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default DropshippingHero;