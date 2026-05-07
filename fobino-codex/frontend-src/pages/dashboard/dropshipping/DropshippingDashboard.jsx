
// import React, { useEffect, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Alert, Skeleton, message } from 'antd';
// import DropshippingHero from '../../../components/dropshipping/DropshippingHero';
// import RoleEntryCard from '../../../components/dropshipping/RoleEntryCard';
// import TutorialVideoModal from '../../../components/dropshipping/TutorialVideoModal';
// import { getDropshippingRoleStatus } from '../../../services/dropshippingService';

// const tutorialContent = {
//   title: 'آموزش شروع کار با دراپ‌شیپینگ',
//   description:
//     'در این ویدئو با منطق کلی نقش‌ها، فرآیند ایجاد و پذیرش RFP، پیگیری سفارش و ساختار مالی سیستم آشنا می‌شوید.',
//   videoUrl: 'https://www.aparat.com/video/video/embed/videohash/abcd1234/vt/frame'
// };

// const defaultRoleState = {
//   provider: {
//     approved: false,
//     exists: false,
//     status: 'not_created',
//     agreementStatus: null
//   },
//   dropshipper: {
//     approved: false,
//     exists: false,
//     status: 'not_created',
//     agreementStatus: null
//   }
// };

// const pageStyles = `
// .dropshipping-entry-page {
//   padding: 24px;
//   direction: rtl;
// }

// .dropshipping-entry-grid {
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: 24px;
// }

// .dropshipping-hero-card {
//   background: linear-gradient(135deg, #0d1b4c 0%, #102766 52%, #183b8c 100%);
//   color: #fff;
//   border-radius: 24px;
//   padding: 28px;
//   display: grid;
//   grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
//   gap: 24px;
//   box-shadow: 0 22px 48px rgba(16, 39, 102, 0.2);
// }

// .dropshipping-hero-card__eyebrow {
//   font-size: 13px;
//   opacity: 0.9;
//   margin-bottom: 10px;
// }

// .dropshipping-hero-card__title {
//   margin: 0 0 14px;
//   font-size: 30px;
//   line-height: 1.5;
//   font-weight: 800;
// }

// .dropshipping-hero-card__description {
//   margin: 0;
//   font-size: 15px;
//   line-height: 2;
//   color: rgba(255,255,255,0.9);
// }

// .dropshipping-hero-card__actions {
//   margin-top: 20px;
// }

// .dropshipping-hero-card__hint {
//   margin-top: 10px;
//   font-size: 12px;
//   color: rgba(255,255,255,0.8);
// }

// .dropshipping-primary-btn,
// .dropshipping-secondary-btn {
//   border: none;
//   outline: none;
//   cursor: pointer;
//   border-radius: 14px;
//   min-height: 48px;
//   padding: 0 18px;
//   font-weight: 700;
//   font-size: 14px;
//   transition: all 0.2s ease;
// }

// .dropshipping-primary-btn {
//   background: #fff;
//   color: #102766;
//   box-shadow: 0 12px 24px rgba(0,0,0,0.12);
// }

// .dropshipping-primary-btn:hover {
//   transform: translateY(-1px);
// }

// .dropshipping-secondary-btn {
//   background: rgba(16, 39, 102, 0.06);
//   color: #102766;
// }

// .dropshipping-secondary-btn:hover {
//   background: rgba(16, 39, 102, 0.1);
// }

// .full-width {
//   width: 100%;
// }

// .dropshipping-hero-card__features {
//   display: flex;
//   flex-direction: column;
//   gap: 14px;
// }

// .dropshipping-hero-feature {
//   display: flex;
//   gap: 14px;
//   background: rgba(255,255,255,0.08);
//   border: 1px solid rgba(255,255,255,0.12);
//   border-radius: 18px;
//   padding: 16px;
//   backdrop-filter: blur(8px);
// }

// .dropshipping-hero-feature__icon {
//   width: 42px;
//   height: 42px;
//   min-width: 42px;
//   border-radius: 14px;
//   background: rgba(255,255,255,0.16);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 18px;
// }

// .dropshipping-hero-feature__title {
//   font-size: 14px;
//   font-weight: 700;
//   margin-bottom: 6px;
// }

// .dropshipping-hero-feature__description {
//   font-size: 13px;
//   line-height: 1.9;
//   color: rgba(255,255,255,0.88);
// }

// .dropshipping-role-grid {
//   display: grid;
//   grid-template-columns: repeat(2, minmax(0, 1fr));
//   gap: 20px;
// }

// .dropshipping-role-card {
//   background: #fff;
//   border-radius: 22px;
//   border: 1px solid #edf1f7;
//   padding: 22px;
//   box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
//   display: flex;
//   flex-direction: column;
//   gap: 18px;
// }

// .dropshipping-role-card.is-approved {
//   border-color: rgba(27, 94, 32, 0.16);
//   box-shadow: 0 16px 38px rgba(20, 120, 50, 0.08);
// }

// .dropshipping-role-card__header {
//   display: flex;
//   align-items: flex-start;
//   justify-content: space-between;
//   gap: 16px;
// }

// .dropshipping-role-card__icon {
//   width: 56px;
//   height: 56px;
//   border-radius: 18px;
//   background: linear-gradient(135deg, #0d1b4c 0%, #183b8c 100%);
//   color: #fff;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 22px;
// }

// .dropshipping-role-card__badge {
//   background: #f4f7fc;
//   color: #102766;
//   padding: 6px 10px;
//   border-radius: 999px;
//   font-size: 12px;
//   font-weight: 700;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
// }

// .dropshipping-role-card__status-wrap {
//   display: flex;
//   flex-direction: column;
//   align-items: flex-end;
//   gap: 8px;
// }

// .dropshipping-role-card__status {
//   display: inline-flex;
//   align-items: center;
//   gap: 8px;
//   font-size: 13px;
//   font-weight: 700;
// }

// .dropshipping-role-card__status.approved {
//   color: #1b5e20;
// }

// .dropshipping-role-card__status.pending {
//   color: #8a5a00;
// }

// .dropshipping-role-card__title {
//   margin: 0;
//   font-size: 21px;
//   color: #102766;
// }

// .dropshipping-role-card__description {
//   margin: 8px 0 0;
//   color: #5f6b7a;
//   line-height: 2;
//   font-size: 14px;
// }

// .dropshipping-role-card__stats {
//   display: grid;
//   grid-template-columns: repeat(3, minmax(0, 1fr));
//   gap: 12px;
//   margin-top: 4px;
// }

// .dropshipping-role-card__stat-item {
//   border-radius: 16px;
//   padding: 14px;
//   background: #f8fafc;
//   border: 1px solid #eef2f7;
// }

// .dropshipping-role-card__stat-value {
//   color: #102766;
//   font-size: 18px;
//   font-weight: 800;
// }

// .dropshipping-role-card__stat-label {
//   color: #687385;
//   font-size: 12px;
//   margin-top: 4px;
// }

// .dropshipping-role-card__footer {
//   display: flex;
//   flex-direction: column;
//   gap: 10px;
//   margin-top: auto;
// }

// .dropshipping-tutorial-modal__description {
//   color: #5f6b7a;
//   line-height: 2;
//   margin-bottom: 16px;
// }

// .dropshipping-tutorial-modal__frame-wrap {
//   border-radius: 20px;
//   overflow: hidden;
//   background: #f7f9fc;
//   border: 1px solid #ecf0f5;
// }

// .dropshipping-tutorial-modal__empty {
//   min-height: 240px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: #6b7280;
//   font-size: 14px;
// }

// @media (max-width: 992px) {
//   .dropshipping-hero-card {
//     grid-template-columns: 1fr;
//   }

//   .dropshipping-role-grid {
//     grid-template-columns: 1fr;
//   }
// }

// @media (max-width: 768px) {
//   .dropshipping-entry-page {
//     padding: 16px;
//   }

//   .dropshipping-hero-card {
//     padding: 20px;
//   }

//   .dropshipping-hero-card__title {
//     font-size: 24px;
//   }

//   .dropshipping-role-card__stats {
//     grid-template-columns: 1fr;
//   }
// }
// `;

// function resolveRoleData(data) {
//   if (!data) return defaultRoleState;

//   return {
//     provider: {
//       approved: Boolean(data.provider?.approved),
//       exists: Boolean(data.provider?.exists),
//       status: data.provider?.status || 'not_created',
//       agreementStatus: data.provider?.agreementStatus || null,
//       summary: data.provider?.summary || null
//     },
//     dropshipper: {
//       approved: Boolean(data.dropshipper?.approved),
//       exists: Boolean(data.dropshipper?.exists),
//       status: data.dropshipper?.status || 'not_created',
//       agreementStatus: data.dropshipper?.agreementStatus || null,
//       summary: data.dropshipper?.summary || null
//     }
//   };
// }

// function getStatusText(roleState) {
//   if (roleState.approved) return 'تایید شده و آماده ورود به پنل';
//   if (roleState.exists && roleState.agreementStatus === 'pending') return 'در انتظار بررسی اطلاعات';
//   if (roleState.exists && roleState.agreementStatus === 'suspended') return 'تعلیق شده';
//   return 'نیازمند تکمیل احراز و تایید';
// }

// const DropshippingDashboard = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [roleStatus, setRoleStatus] = useState(defaultRoleState);
//   const [tutorialOpen, setTutorialOpen] = useState(false);

//   useEffect(() => {
//     let mounted = true;

//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const res = await getDropshippingRoleStatus();
//         const payload = res?.data || res?.result || res;

//         if (!mounted) return;
//         setRoleStatus(resolveRoleData(payload));
//       } catch (error) {
//         if (!mounted) return;
//         message.error('دریافت اطلاعات دراپ‌شیپینگ با مشکل مواجه شد');
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     fetchData();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const providerStats = useMemo(() => {
//     if (!roleStatus.provider.approved || !roleStatus.provider.summary) return [];

//     return [
//       { label: 'RFP فعال', value: roleStatus.provider.summary.activeRfps ?? 0 },
//       { label: 'محصول فعال', value: roleStatus.provider.summary.activeProducts ?? 0 },
//       { label: 'نیازمند اقدام', value: roleStatus.provider.summary.needsAttention ?? 0 }
//     ];
//   }, [roleStatus.provider]);

//   const dropshipperStats = useMemo(() => {
//     if (!roleStatus.dropshipper.approved || !roleStatus.dropshipper.summary) return [];

//     return [
//       { label: 'درخواست‌های من', value: roleStatus.dropshipper.summary.myRfps ?? 0 },
//       { label: 'محصول پذیرفته‌شده', value: roleStatus.dropshipper.summary.acceptedProducts ?? 0 },
//       { label: 'نیازمند اقدام', value: roleStatus.dropshipper.summary.needsAttention ?? 0 }
//     ];
//   }, [roleStatus.dropshipper]);

//   return (
//     <>
//       <style>{pageStyles}</style>

//       <div className="dropshipping-entry-page">
//         <div className="dropshipping-entry-grid">
//           <DropshippingHero onOpenTutorial={() => setTutorialOpen(true)} />

//           {!loading && roleStatus.provider.agreementStatus === 'suspended' ? (
//             <Alert
//               type="warning"
//               showIcon
//               message="دسترسی تامین‌کننده شما در حال حاضر تعلیق شده است"
//               description="تا زمان رفع تعلیق توسط ادمین، امکان ورود به پنل تامین‌کننده وجود ندارد."
//             />
//           ) : null}

//           {loading ? (
//             <div style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
//               <Skeleton active paragraph={{ rows: 8 }} />
//             </div>
//           ) : (
//             <div className="dropshipping-role-grid">
//               <RoleEntryCard
//                 role="provider"
//                 title="پنل تامین‌کننده"
//                 description="ایجاد محصول، مدیریت محصولات، پیگیری RFPها و مشاهده دقیق وضعیت مالی مربوط به دراپ‌شیپینگ."
//                 approved={roleStatus.provider.approved}
//                 statusText={getStatusText(roleStatus.provider)}
//                 badge="نقش تامین‌کننده"
//                 stats={providerStats}
//                 primaryActionLabel={roleStatus.provider.approved ? 'ورود به پنل تامین‌کننده' : 'تکمیل تایید تامین‌کننده'}
//                 secondaryActionLabel={!roleStatus.provider.approved ? 'مشاهده آموزش' : null}
//                 onPrimaryAction={() => {
//                   if (roleStatus.provider.approved) {
//                     navigate('/dashboard/dropshipping/provider');
//                     return;
//                   }
//                   navigate('/dashboard/dropshipping/verification?role=provider');
//                 }}
//                 onSecondaryAction={() => setTutorialOpen(true)}
//               />

//               <RoleEntryCard
//                 role="dropshipper"
//                 title="پنل دراپ‌شیپر"
//                 description="مرور محصولات، ایجاد RFP، مدیریت محصولات پذیرفته‌شده و دنبال‌کردن وضعیت‌های مالی و سفارش‌ها."
//                 approved={roleStatus.dropshipper.approved}
//                 statusText={getStatusText(roleStatus.dropshipper)}
//                 badge="نقش دراپ‌شیپر"
//                 stats={dropshipperStats}
//                 primaryActionLabel={roleStatus.dropshipper.approved ? 'ورود به پنل دراپ‌شیپر' : 'تکمیل تایید دراپ‌شیپر'}
//                 secondaryActionLabel={!roleStatus.dropshipper.approved ? 'مشاهده آموزش' : null}
//                 onPrimaryAction={() => {
//                   if (roleStatus.dropshipper.approved) {
//                     navigate('/dashboard/dropshipping/dropshipper');
//                     return;
//                   }
//                   navigate('/dashboard/dropshipping/verification?role=dropshipper');
//                 }}
//                 onSecondaryAction={() => setTutorialOpen(true)}
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       <TutorialVideoModal
//         open={tutorialOpen}
//         onClose={() => setTutorialOpen(false)}
//         videoUrl={tutorialContent.videoUrl}
//         title={tutorialContent.title}
//         description={tutorialContent.description}
//       />
//     </>
//   );
// };

// export default DropshippingDashboard;


/* frontend/my-app/src/pages/dashboard/dropshipping/DropshippingDashboard.jsx */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dropshippingService from '../../../services/dropshippingService';
import DropshippingHero from '../../../components/dropshipping/DropshippingHero';
import RoleEntryCard from '../../../components/dropshipping/RoleEntryCard';
import TutorialVideoModal from '../../../components/dropshipping/TutorialVideoModal';

const tutorialContent = {
  title: 'آموزش شروع کار با دراپ‌شیپینگ',
  description:
    'در این ویدئو با منطق کلی نقش‌ها، فرآیند ایجاد و پذیرش RFP، پیگیری سفارش و ساختار مالی سیستم آشنا می‌شوید.',
  videoUrl: 'https://www.aparat.com/video/video/embed/videohash/abcd1234/vt/frame'
};

const defaultRoleState = {
  provider: {
    approved: false,
    exists: false,
    status: 'not_created',
    agreementStatus: null
  },
  dropshipper: {
    approved: false,
    exists: false,
    status: 'not_created',
    agreementStatus: null
  }
};

// Custom Alert Component
const CustomAlert = ({ type, showIcon, message: alertMessage, description, style }) => {
  const getIcon = () => {
    switch(type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getColors = () => {
    switch(type) {
      case 'warning': return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
      case 'success': return { bg: '#d1fae5', border: '#10b981', text: '#065f46' };
      case 'info': return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
      default: return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      ...style
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {showIcon && <span style={{ fontSize: '20px' }}>{getIcon()}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
            {alertMessage}
          </div>
          {description && (
            <div style={{ color: colors.text, opacity: 0.8, fontSize: '13px', marginTop: '4px' }}>
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom Skeleton Component
const CustomSkeleton = ({ active, paragraph }) => {
  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
      <div style={{ animation: active ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
        <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '12px', width: '40%' }}></div>
        {paragraph && (
          <>
            <div style={{ height: '16px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px' }}></div>
            <div style={{ height: '16px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '90%' }}></div>
            <div style={{ height: '16px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '80%' }}></div>
            <div style={{ height: '16px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '70%' }}></div>
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

function resolveRoleData(data) {
  if (!data) return defaultRoleState;

  return {
    provider: {
      approved: Boolean(data.provider?.approved),
      exists: Boolean(data.provider?.exists),
      status: data.provider?.status || 'not_created',
      agreementStatus: data.provider?.agreementStatus || null,
      summary: data.provider?.summary || null
    },
    dropshipper: {
      approved: Boolean(data.dropshipper?.approved),
      exists: Boolean(data.dropshipper?.exists),
      status: data.dropshipper?.status || 'not_created',
      agreementStatus: data.dropshipper?.agreementStatus || null,
      summary: data.dropshipper?.summary || null
    }
  };
}

function getStatusText(roleState) {
  if (roleState.approved) return 'تایید شده و آماده ورود به پنل';
  if (roleState.exists && roleState.agreementStatus === 'pending') return 'در انتظار بررسی اطلاعات';
  if (roleState.exists && roleState.agreementStatus === 'suspended') return 'تعلیق شده';
  return 'نیازمند تکمیل احراز و تایید';
}

const DropshippingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roleStatus, setRoleStatus] = useState(defaultRoleState);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await dropshippingService.getDropshippingRoleStatus();
        const payload = res?.data || res?.result || res;

        if (!mounted) return;
        setRoleStatus(resolveRoleData(payload));
      } catch (error) {
        console.error('Error fetching dropshipping role status:', error);
        if (!mounted) return;
        alert('دریافت اطلاعات دراپ‌شیپینگ با مشکل مواجه شد');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const providerStats = useMemo(() => {
    if (!roleStatus.provider.approved || !roleStatus.provider.summary) return [];

    return [
      { label: 'RFP فعال', value: roleStatus.provider.summary.activeRfps ?? 0 },
      { label: 'محصول فعال', value: roleStatus.provider.summary.activeProducts ?? 0 },
      { label: 'نیازمند اقدام', value: roleStatus.provider.summary.needsAttention ?? 0 }
    ];
  }, [roleStatus.provider]);

  const dropshipperStats = useMemo(() => {
    if (!roleStatus.dropshipper.approved || !roleStatus.dropshipper.summary) return [];

    return [
      { label: 'درخواست‌های من', value: roleStatus.dropshipper.summary.myRfps ?? 0 },
      { label: 'محصول پذیرفته‌شده', value: roleStatus.dropshipper.summary.acceptedProducts ?? 0 },
      { label: 'نیازمند اقدام', value: roleStatus.dropshipper.summary.needsAttention ?? 0 }
    ];
  }, [roleStatus.dropshipper]);

  const pageStyles = `
    .dropshipping-entry-page {
      padding: 24px;
      direction: rtl;
    }

    .dropshipping-entry-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

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

    .dropshipping-hero-card__eyebrow {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 10px;
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
    }

    .dropshipping-primary-btn {
      background: #fff;
      color: #102766;
      box-shadow: 0 12px 24px rgba(0,0,0,0.12);
    }

    .dropshipping-primary-btn:hover {
      transform: translateY(-1px);
    }

    .dropshipping-secondary-btn {
      background: rgba(16, 39, 102, 0.06);
      color: #102766;
    }

    .dropshipping-secondary-btn:hover {
      background: rgba(16, 39, 102, 0.1);
    }

    .full-width {
      width: 100%;
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
      font-size: 18px;
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

    .dropshipping-role-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .dropshipping-role-card {
      background: #fff;
      border-radius: 22px;
      border: 1px solid #edf1f7;
      padding: 22px;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
      display: flex;
      flex-direction: column;
      gap: 18px;
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
      font-size: 22px;
    }

    .dropshipping-role-card__badge {
      background: #f4f7fc;
      color: #102766;
      padding: 6px 10px;
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
      margin-top: 4px;
    }

    .dropshipping-role-card__stat-item {
      border-radius: 16px;
      padding: 14px;
      background: #f8fafc;
      border: 1px solid #eef2f7;
    }

    .dropshipping-role-card__stat-value {
      color: #102766;
      font-size: 18px;
      font-weight: 800;
    }

    .dropshipping-role-card__stat-label {
      color: #687385;
      font-size: 12px;
      margin-top: 4px;
    }

    .dropshipping-role-card__footer {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: auto;
    }

    .dropshipping-tutorial-modal__description {
      color: #5f6b7a;
      line-height: 2;
      margin-bottom: 16px;
    }

    .dropshipping-tutorial-modal__frame-wrap {
      border-radius: 20px;
      overflow: hidden;
      background: #f7f9fc;
      border: 1px solid #ecf0f5;
    }

    .dropshipping-tutorial-modal__empty {
      min-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 14px;
    }

    @media (max-width: 992px) {
      .dropshipping-hero-card {
        grid-template-columns: 1fr;
      }

      .dropshipping-role-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dropshipping-entry-page {
        padding: 16px;
      }

      .dropshipping-hero-card {
        padding: 20px;
      }

      .dropshipping-hero-card__title {
        font-size: 24px;
      }

      .dropshipping-role-card__stats {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div className="dropshipping-entry-page">
        <div className="dropshipping-entry-grid">
          <DropshippingHero onOpenTutorial={() => setTutorialOpen(true)} />

          {!loading && roleStatus.provider.agreementStatus === 'suspended' ? (
            <CustomAlert
              type="warning"
              showIcon={true}
              message="دسترسی تامین‌کننده شما در حال حاضر تعلیق شده است"
              description="تا زمان رفع تعلیق توسط ادمین، امکان ورود به پنل تامین‌کننده وجود ندارد."
            />
          ) : null}

          {loading ? (
            <CustomSkeleton active paragraph={{ rows: 8 }} />
          ) : (
            <div className="dropshipping-role-grid">
              <RoleEntryCard
                role="provider"
                title="پنل تامین‌کننده"
                description="ایجاد محصول، مدیریت محصولات، پیگیری RFPها و مشاهده دقیق وضعیت مالی مربوط به دراپ‌شیپینگ."
                approved={roleStatus.provider.approved}
                statusText={getStatusText(roleStatus.provider)}
                badge="نقش تامین‌کننده"
                stats={providerStats}
                primaryActionLabel={roleStatus.provider.approved ? 'ورود به پنل تامین‌کننده' : 'تکمیل تایید تامین‌کننده'}
                secondaryActionLabel={!roleStatus.provider.approved ? 'مشاهده آموزش' : null}
                onPrimaryAction={() => {
                  if (roleStatus.provider.approved) {
                    navigate('/dashboard/dropshipping/provider');
                    return;
                  }
                  navigate('/dashboard/dropshipping/verification?role=provider');
                }}
                onSecondaryAction={() => setTutorialOpen(true)}
              />

              <RoleEntryCard
                role="dropshipper"
                title="پنل دراپ‌شیپر"
                description="مرور محصولات، ایجاد RFP، مدیریت محصولات پذیرفته‌شده و دنبال‌کردن وضعیت‌های مالی و سفارش‌ها."
                approved={roleStatus.dropshipper.approved}
                statusText={getStatusText(roleStatus.dropshipper)}
                badge="نقش دراپ‌شیپر"
                stats={dropshipperStats}
                primaryActionLabel={roleStatus.dropshipper.approved ? 'ورود به پنل دراپ‌شیپر' : 'تکمیل تایید دراپ‌شیپر'}
                secondaryActionLabel={!roleStatus.dropshipper.approved ? 'مشاهده آموزش' : null}
                onPrimaryAction={() => {
                  if (roleStatus.dropshipper.approved) {
                    navigate('/dashboard/dropshipping/dropshipper');
                    return;
                  }
                  navigate('/dashboard/dropshipping/verification?role=dropshipper');
                }}
                onSecondaryAction={() => setTutorialOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      <TutorialVideoModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        videoUrl={tutorialContent.videoUrl}
        title={tutorialContent.title}
        description={tutorialContent.description}
      />
    </>
  );
};

export default DropshippingDashboard;