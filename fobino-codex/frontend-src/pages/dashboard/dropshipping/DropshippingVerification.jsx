// import React, { useEffect, useMemo, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { Alert, Checkbox, Form, Input, Select, Skeleton, message } from 'antd';
// import { createDropshippingAgreement, getDropshippingRoleStatus } from '../../../services/dropshippingService';

// const { TextArea } = Input;

// const pageStyles = `
// .dropshipping-verification-page {
//   padding: 24px;
//   direction: rtl;
// }

// .dropshipping-verification-layout {
//   display: grid;
//   grid-template-columns: 340px minmax(0, 1fr);
//   gap: 24px;
// }

// .dropshipping-verification-side,
// .dropshipping-verification-main {
//   background: #fff;
//   border-radius: 22px;
//   border: 1px solid #edf1f7;
//   box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
// }

// .dropshipping-verification-side {
//   padding: 22px;
//   position: sticky;
//   top: 24px;
//   height: fit-content;
// }

// .dropshipping-verification-main {
//   padding: 24px;
// }

// .dropshipping-verification-eyebrow {
//   color: #183b8c;
//   font-size: 12px;
//   font-weight: 800;
//   margin-bottom: 10px;
// }

// .dropshipping-verification-title {
//   margin: 0 0 12px;
//   font-size: 28px;
//   line-height: 1.6;
//   color: #102766;
// }

// .dropshipping-verification-description {
//   color: #5f6b7a;
//   line-height: 2;
//   font-size: 14px;
//   margin: 0;
// }

// .dropshipping-checklist {
//   margin-top: 20px;
//   display: flex;
//   flex-direction: column;
//   gap: 12px;
// }

// .dropshipping-checklist__item {
//   background: #f8fafc;
//   border-radius: 16px;
//   border: 1px solid #eef2f7;
//   padding: 14px;
// }

// .dropshipping-checklist__title {
//   font-weight: 700;
//   color: #102766;
//   margin-bottom: 6px;
// }

// .dropshipping-checklist__desc {
//   font-size: 13px;
//   color: #697586;
//   line-height: 1.9;
// }

// .dropshipping-form-grid {
//   display: grid;
//   grid-template-columns: repeat(2, minmax(0, 1fr));
//   gap: 16px;
// }

// .dropshipping-form-grid .full-span {
//   grid-column: 1 / -1;
// }

// .dropshipping-form-actions {
//   margin-top: 24px;
//   display: flex;
//   gap: 12px;
//   flex-wrap: wrap;
// }

// .dropshipping-primary-submit,
// .dropshipping-secondary-submit {
//   min-width: 170px;
//   min-height: 46px;
//   border-radius: 14px;
//   border: none;
//   cursor: pointer;
//   font-size: 14px;
//   font-weight: 700;
// }

// .dropshipping-primary-submit {
//   background: #102766;
//   color: #fff;
// }

// .dropshipping-secondary-submit {
//   background: #eef3fb;
//   color: #102766;
// }

// @media (max-width: 992px) {
//   .dropshipping-verification-layout {
//     grid-template-columns: 1fr;
//   }

//   .dropshipping-verification-side {
//     position: static;
//   }
// }

// @media (max-width: 768px) {
//   .dropshipping-verification-page {
//     padding: 16px;
//   }

//   .dropshipping-form-grid {
//     grid-template-columns: 1fr;
//   }

//   .dropshipping-verification-title {
//     font-size: 24px;
//   }
// }
// `;

// function useQuery() {
//   const { search } = useLocation();
//   return useMemo(() => new URLSearchParams(search), [search]);
// }

// function normalizeRole(role) {
//   return role === 'provider' ? 'provider' : 'dropshipper';
// }

// function getRoleContent(role) {
//   if (role === 'provider') {
//     return {
//       title: 'احراز و فعال‌سازی نقش تامین‌کننده',
//       description:
//         'برای ورود به پنل تامین‌کننده، اطلاعات پایه کسب‌وکار و مشخصات تسویه را تکمیل کنید تا درخواست شما برای بررسی ثبت شود.',
//       checklist: [
//         {
//           title: 'اطلاعات کسب‌وکار',
//           description: 'نام کسب‌وکار، نوع فعالیت، توضیح کوتاه و اطلاعات هویتی/حقوقی را کامل وارد کنید.'
//         },
//         {
//           title: 'اطلاعات بانکی و تسویه',
//           description: 'اطلاعات حساب یا شبا باید دقیق و متعلق به همان هویت تاییدشده باشد.'
//         },
//         {
//           title: 'تطبیق و بررسی توسط ادمین',
//           description: 'بعد از ثبت، وضعیت شما در حالت pending قرار می‌گیرد و پس از تایید، ورود به پنل فعال می‌شود.'
//         }
//       ]
//     };
//   }

//   return {
//     title: 'احراز و فعال‌سازی نقش دراپ‌شیپر',
//     description:
//       'برای ورود به پنل دراپ‌شیپر، اطلاعات پایه هویتی و تسویه را تکمیل کنید تا دسترسی شما به فضای محصولات و RFP فعال شود.',
//     checklist: [
//       {
//         title: 'ثبت اطلاعات پایه',
//         description: 'مشخصات فردی/کسب‌وکاری و اطلاعات موردنیاز برای بررسی نقش دراپ‌شیپر را تکمیل کنید.'
//       },
//       {
//         title: 'تایید قوانین همکاری',
//         description: 'با پذیرش قوانین، مسئولیت اجرای صحیح جریان سفارش‌ها و پرداخت‌ها را می‌پذیرید.'
//       },
//       {
//         title: 'فعال‌سازی دسترسی',
//         description: 'پس از تایید، می‌توانید محصولات را ببینید، RFP بسازید و از پنل مالی استفاده کنید.'
//       }
//     ]
//   };
// }

// const DropshippingVerification = () => {
//   const navigate = useNavigate();
//   const query = useQuery();
//   const role = normalizeRole(query.get('role'));
//   const [form] = Form.useForm();
//   const [submitting, setSubmitting] = useState(false);
//   const [loadingStatus, setLoadingStatus] = useState(true);
//   const [roleStatus, setRoleStatus] = useState(null);

//   const content = useMemo(() => getRoleContent(role), [role]);

//   useEffect(() => {
//     let mounted = true;

//     const fetchStatus = async () => {
//       try {
//         setLoadingStatus(true);
//         const res = await getDropshippingRoleStatus();
//         const payload = res?.data || res?.result || res;
//         if (!mounted) return;
//         setRoleStatus(payload?.[role] || null);
//       } catch (error) {
//         if (!mounted) return;
//         message.error('دریافت وضعیت تایید با مشکل مواجه شد');
//       } finally {
//         if (mounted) setLoadingStatus(false);
//       }
//     };

//     fetchStatus();

//     return () => {
//       mounted = false;
//     };
//   }, [role]);

//   const onFinish = async (values) => {
//     try {
//       setSubmitting(true);

//       const payload = {
//         role,
//         termsAccepted: true,
//         businessInfo: {
//           legalName: values.legalName,
//           businessName: values.businessName,
//           activityType: values.activityType,
//           nationalCode: values.nationalCode,
//           description: values.description
//         },
//         bankInfo: {
//           accountHolderName: values.accountHolderName,
//           iban: values.iban,
//           cardNumber: values.cardNumber
//         }
//       };

//       await createDropshippingAgreement(payload);
//       message.success('درخواست شما با موفقیت ثبت شد');
//       navigate('/dashboard/dropshipping');
//     } catch (error) {
//       message.error(error?.response?.data?.message || 'ثبت اطلاعات با مشکل مواجه شد');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const isApproved = Boolean(roleStatus?.approved);
//   const isPending = roleStatus?.agreementStatus === 'pending';
//   const isSuspended = roleStatus?.agreementStatus === 'suspended';

//   return (
//     <>
//       <style>{pageStyles}</style>

//       <div className="dropshipping-verification-page">
//         <div className="dropshipping-verification-layout">
//           <aside className="dropshipping-verification-side">
//             <div className="dropshipping-verification-eyebrow">فرآیند تایید نقش</div>
//             <h1 className="dropshipping-verification-title">{content.title}</h1>
//             <p className="dropshipping-verification-description">{content.description}</p>

//             <div className="dropshipping-checklist">
//               {content.checklist.map((item) => (
//                 <div className="dropshipping-checklist__item" key={item.title}>
//                   <div className="dropshipping-checklist__title">{item.title}</div>
//                   <div className="dropshipping-checklist__desc">{item.description}</div>
//                 </div>
//               ))}
//             </div>
//           </aside>

//           <section className="dropshipping-verification-main">
//             {loadingStatus ? (
//               <Skeleton active paragraph={{ rows: 10 }} />
//             ) : (
//               <>
//                 {isApproved ? (
//                   <Alert
//                     type="success"
//                     showIcon
//                     message="این نقش قبلاً تایید شده است"
//                     description="شما می‌توانید مستقیماً وارد پنل مربوطه شوید."
//                     style={{ marginBottom: 20 }}
//                   />
//                 ) : null}

//                 {isPending ? (
//                   <Alert
//                     type="info"
//                     showIcon
//                     message="درخواست شما در حال بررسی است"
//                     description="تا زمان بررسی توسط ادمین، امکان ثبت مجدد وجود ندارد."
//                     style={{ marginBottom: 20 }}
//                   />
//                 ) : null}

//                 {isSuspended ? (
//                   <Alert
//                     type="warning"
//                     showIcon
//                     message="وضعیت این نقش تعلیق شده است"
//                     description="برای فعال‌سازی مجدد لازم است ادمین وضعیت شما را از حالت تعلیق خارج کند."
//                     style={{ marginBottom: 20 }}
//                   />
//                 ) : null}

//                 {!isApproved && !isPending && !isSuspended ? (
//                   <Form layout="vertical" form={form} onFinish={onFinish}>
//                     <div className="dropshipping-form-grid">
//                       <Form.Item
//                         className="full-span"
//                         label="نام و نام خانوادگی / نام حقوقی"
//                         name="legalName"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Input size="large" placeholder="مثلاً شرکت نمونه تجارت" />
//                       </Form.Item>

//                       <Form.Item
//                         label="نام کسب‌وکار / برند"
//                         name="businessName"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Input size="large" placeholder="مثلاً فروشگاه نمونه" />
//                       </Form.Item>

//                       <Form.Item
//                         label="نوع فعالیت"
//                         name="activityType"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Select
//                           size="large"
//                           placeholder="انتخاب کنید"
//                           options={[
//                             { label: 'حقیقی', value: 'individual' },
//                             { label: 'حقوقی', value: 'company' },
//                             { label: 'فروشگاه آنلاین', value: 'online_store' },
//                             { label: 'توزیع‌کننده', value: 'distributor' }
//                           ]}
//                         />
//                       </Form.Item>

//                       <Form.Item
//                         label="کد ملی / شناسه ملی"
//                         name="nationalCode"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Input size="large" placeholder="مثلاً 1234567890" />
//                       </Form.Item>

//                       <Form.Item
//                         label="نام صاحب حساب"
//                         name="accountHolderName"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Input size="large" placeholder="نام صاحب حساب" />
//                       </Form.Item>

//                       <Form.Item
//                         label="شماره شبا"
//                         name="iban"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Input size="large" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx" />
//                       </Form.Item>

//                       <Form.Item
//                         label="شماره کارت"
//                         name="cardNumber"
//                         rules={[{ required: true, message: 'این فیلد الزامی است' }]}
//                       >
//                         <Input size="large" placeholder="شماره کارت" />
//                       </Form.Item>

//                       <Form.Item className="full-span" label="توضیحات تکمیلی" name="description">
//                         <TextArea rows={5} placeholder="توضیح کوتاه درباره نوع فعالیت، مدل همکاری یا اطلاعات تکمیلی" />
//                       </Form.Item>

//                       <Form.Item
//                         className="full-span"
//                         name="acceptTerms"
//                         valuePropName="checked"
//                         rules={[
//                           {
//                             validator: (_, value) =>
//                               value ? Promise.resolve() : Promise.reject(new Error('پذیرش قوانین الزامی است'))
//                           }
//                         ]}
//                       >
//                         <Checkbox>
//                           قوانین همکاری دراپ‌شیپینگ را مطالعه کرده‌ام و با ثبت این درخواست موافقم.
//                         </Checkbox>
//                       </Form.Item>
//                     </div>

//                     <div className="dropshipping-form-actions">
//                       <button type="submit" className="dropshipping-primary-submit" disabled={submitting}>
//                         {submitting ? 'در حال ثبت...' : 'ثبت درخواست تایید'}
//                       </button>

//                       <button
//                         type="button"
//                         className="dropshipping-secondary-submit"
//                         onClick={() => navigate('/dashboard/dropshipping')}
//                       >
//                         بازگشت به داشبورد دراپ‌شیپینگ
//                       </button>
//                     </div>
//                   </Form>
//                 ) : (
//                   <div className="dropshipping-form-actions">
//                     <button
//                       type="button"
//                       className="dropshipping-primary-submit"
//                       onClick={() =>
//                         navigate(
//                           role === 'provider'
//                             ? '/dashboard/dropshipping/provider'
//                             : '/dashboard/dropshipping/dropshipper'
//                         )
//                       }
//                     >
//                       {isApproved ? 'ورود به پنل' : 'بازگشت'}
//                     </button>

//                     <button
//                       type="button"
//                       className="dropshipping-secondary-submit"
//                       onClick={() => navigate('/dashboard/dropshipping')}
//                     >
//                       بازگشت به صفحه اصلی دراپ‌شیپینگ
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}
//           </section>
//         </div>
//       </div>
//     </>
//   );
// };

// export default DropshippingVerification;




/* frontend/my-app/src/pages/dashboard/dropshipping/DropshippingVerification.jsx */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dropshippingService from '../../../services/dropshippingService';

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
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Custom Input Component
const CustomInput = ({ value, onChange, placeholder, type = "text", size = "large", className = "" }) => {
  const sizeStyles = {
    large: { padding: '12px 16px' },
    default: { padding: '10px 14px' },
    small: { padding: '6px 10px' }
  };

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={{
        width: '100%',
        ...sizeStyles[size],
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: size === 'large' ? '16px' : '14px',
        transition: 'all 0.2s',
        fontFamily: 'inherit'
      }}
      onFocus={(e) => e.target.style.borderColor = '#102766'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
    />
  );
};

// Custom Select Component
const CustomSelect = ({ value, onChange, placeholder, options, size = "large", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const sizeStyles = {
    large: { padding: '12px 16px' },
    default: { padding: '10px 14px' },
    small: { padding: '6px 10px' }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...sizeStyles[size],
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          fontSize: size === 'large' ? '16px' : '14px',
          cursor: 'pointer',
          background: '#fff',
          color: value ? '#1f2937' : '#9ca3af'
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span style={{ float: 'left' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          zIndex: 100,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                color: '#1f2937'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = '#fff'}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom TextArea Component
const CustomTextArea = ({ value, onChange, placeholder, rows = 5, className = "" }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={className}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '14px',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
        resize: 'vertical'
      }}
      onFocus={(e) => e.target.style.borderColor = '#102766'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
    />
  );
};

// Custom Checkbox Component
const CustomCheckbox = ({ checked, onChange, children }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <span style={{ fontSize: '14px', color: '#5f6b7a' }}>{children}</span>
    </label>
  );
};

// Custom Form Item Component
const CustomFormItem = ({ label, children, required, error, className = "" }) => {
  return (
    <div className={className} style={{ marginBottom: '20px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#102766'
        }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function normalizeRole(role) {
  return role === 'provider' ? 'provider' : 'dropshipper';
}

function getRoleContent(role) {
  if (role === 'provider') {
    return {
      title: 'احراز و فعال‌سازی نقش تامین‌کننده',
      description:
        'برای ورود به پنل تامین‌کننده، اطلاعات پایه کسب‌وکار و مشخصات تسویه را تکمیل کنید تا درخواست شما برای بررسی ثبت شود.',
      checklist: [
        {
          title: 'اطلاعات کسب‌وکار',
          description: 'نام کسب‌وکار، نوع فعالیت، توضیح کوتاه و اطلاعات هویتی/حقوقی را کامل وارد کنید.'
        },
        {
          title: 'اطلاعات بانکی و تسویه',
          description: 'اطلاعات حساب یا شبا باید دقیق و متعلق به همان هویت تاییدشده باشد.'
        },
        {
          title: 'تطبیق و بررسی توسط ادمین',
          description: 'بعد از ثبت، وضعیت شما در حالت pending قرار می‌گیرد و پس از تایید، ورود به پنل فعال می‌شود.'
        }
      ]
    };
  }

  return {
    title: 'احراز و فعال‌سازی نقش دراپ‌شیپر',
    description:
      'برای ورود به پنل دراپ‌شیپر، اطلاعات پایه هویتی و تسویه را تکمیل کنید تا دسترسی شما به فضای محصولات و RFP فعال شود.',
    checklist: [
      {
        title: 'ثبت اطلاعات پایه',
        description: 'مشخصات فردی/کسب‌وکاری و اطلاعات موردنیاز برای بررسی نقش دراپ‌شیپر را تکمیل کنید.'
      },
      {
        title: 'تایید قوانین همکاری',
        description: 'با پذیرش قوانین، مسئولیت اجرای صحیح جریان سفارش‌ها و پرداخت‌ها را می‌پذیرید.'
      },
      {
        title: 'فعال‌سازی دسترسی',
        description: 'پس از تایید، می‌توانید محصولات را ببینید، RFP بسازید و از پنل مالی استفاده کنید.'
      }
    ]
  };
}

const DropshippingVerification = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const role = normalizeRole(query.get('role'));
  const [formData, setFormData] = useState({
    legalName: '',
    businessName: '',
    activityType: '',
    nationalCode: '',
    description: '',
    accountHolderName: '',
    iban: '',
    cardNumber: '',
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [roleStatus, setRoleStatus] = useState(null);

  const content = useMemo(() => getRoleContent(role), [role]);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await dropshippingService.getDropshippingRoleStatus();
        const payload = res?.data || res?.result || res;
        if (!mounted) return;
        setRoleStatus(payload?.[role] || null);
      } catch (error) {
        console.error('Error fetching role status:', error);
        if (!mounted) return;
        alert('دریافت وضعیت تایید با مشکل مواجه شد');
      } finally {
        if (mounted) setLoadingStatus(false);
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [role]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    const requiredFields = ['legalName', 'businessName', 'activityType', 'nationalCode', 'accountHolderName', 'iban', 'cardNumber'];
    
    if (requiredFields.includes(name)) {
      if (!value?.trim()) {
        newErrors[name] = 'این فیلد الزامی است';
      } else {
        delete newErrors[name];
      }
    }
    
    if (name === 'acceptTerms' && !value) {
      newErrors.acceptTerms = 'پذیرش قوانین الزامی است';
    } else if (name === 'acceptTerms') {
      delete newErrors.acceptTerms;
    }
    
    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    const fields = ['legalName', 'businessName', 'activityType', 'nationalCode', 'accountHolderName', 'iban', 'cardNumber'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    if (!validateField('acceptTerms', formData.acceptTerms)) {
      isValid = false;
    }
    
    return isValid;
  };

  // Find the onFinish function (around line 230-250) and update it:

const onFinish = async () => {
  if (!validateForm()) return;
  
  try {
    setSubmitting(true);

    // Map activityType to businessType
    let businessType = 'individual';
    if (formData.activityType === 'company') businessType = 'company';
    if (formData.activityType === 'partnership') businessType = 'partnership';
    if (formData.activityType === 'online_store') businessType = 'company';
    if (formData.activityType === 'distributor') businessType = 'company';

    const payload = {
      role,
      termsAccepted: true,
      businessInfo: {
        businessName: formData.businessName,  // Changed from legalName to businessName
        businessType: businessType,           // Changed from activityType to businessType
        registrationNumber: formData.nationalCode,  // nationalCode as registrationNumber
        taxId: formData.nationalCode,                // optional
        address: {
          province: '',
          city: '',
          street: '',
          postalCode: ''
        },
        phone: '',
        email: ''
      },
      bankInfo: {
        accountHolderName: formData.accountHolderName,
        bankName: '',                           // Add bank name field to your form if needed
        accountNumber: '',                      // Add account number field
        iban: formData.iban,
        shabaNumber: formData.iban
      },
      identityVerification: {
        nationalIdCard: {
          url: '',
          publicId: ''
        },
        businessLicense: {
          url: '',
          publicId: ''
        }
      }
    };

    await dropshippingService.createAgreement(payload);
    alert('درخواست شما با موفقیت ثبت شد');
    navigate('/dashboard/dropshipping');
  } catch (error) {
    console.error('Error creating agreement:', error);
    alert(error?.response?.data?.message || 'ثبت اطلاعات با مشکل مواجه شد');
  } finally {
    setSubmitting(false);
  }
};

  const isApproved = Boolean(roleStatus?.approved);
  const isPending = roleStatus?.agreementStatus === 'pending';
  const isSuspended = roleStatus?.agreementStatus === 'suspended';

  const pageStyles = `
    .dropshipping-verification-page {
      padding: 24px;
      direction: rtl;
    }

    .dropshipping-verification-layout {
      display: grid;
      grid-template-columns: 340px minmax(0, 1fr);
      gap: 24px;
    }

    .dropshipping-verification-side,
    .dropshipping-verification-main {
      background: #fff;
      border-radius: 22px;
      border: 1px solid #edf1f7;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
    }

    .dropshipping-verification-side {
      padding: 22px;
      position: sticky;
      top: 24px;
      height: fit-content;
    }

    .dropshipping-verification-main {
      padding: 24px;
    }

    .dropshipping-verification-eyebrow {
      color: #183b8c;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .dropshipping-verification-title {
      margin: 0 0 12px;
      font-size: 28px;
      line-height: 1.6;
      color: #102766;
    }

    .dropshipping-verification-description {
      color: #5f6b7a;
      line-height: 2;
      font-size: 14px;
      margin: 0;
    }

    .dropshipping-checklist {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dropshipping-checklist__item {
      background: #f8fafc;
      border-radius: 16px;
      border: 1px solid #eef2f7;
      padding: 14px;
    }

    .dropshipping-checklist__title {
      font-weight: 700;
      color: #102766;
      margin-bottom: 6px;
    }

    .dropshipping-checklist__desc {
      font-size: 13px;
      color: #697586;
      line-height: 1.9;
    }

    .dropshipping-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .dropshipping-form-grid .full-span {
      grid-column: 1 / -1;
    }

    .dropshipping-form-actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .dropshipping-primary-submit,
    .dropshipping-secondary-submit {
      min-width: 170px;
      min-height: 46px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
    }

    .dropshipping-primary-submit {
      background: #102766;
      color: #fff;
    }

    .dropshipping-primary-submit:hover:not(:disabled) {
      background: #183b8c;
      transform: translateY(-1px);
    }

    .dropshipping-primary-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .dropshipping-secondary-submit {
      background: #eef3fb;
      color: #102766;
    }

    .dropshipping-secondary-submit:hover {
      background: #e5edf8;
      transform: translateY(-1px);
    }

    @media (max-width: 992px) {
      .dropshipping-verification-layout {
        grid-template-columns: 1fr;
      }

      .dropshipping-verification-side {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .dropshipping-verification-page {
        padding: 16px;
      }

      .dropshipping-form-grid {
        grid-template-columns: 1fr;
      }

      .dropshipping-verification-title {
        font-size: 24px;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div className="dropshipping-verification-page">
        <div className="dropshipping-verification-layout">
          <aside className="dropshipping-verification-side">
            <div className="dropshipping-verification-eyebrow">فرآیند تایید نقش</div>
            <h1 className="dropshipping-verification-title">{content.title}</h1>
            <p className="dropshipping-verification-description">{content.description}</p>

            <div className="dropshipping-checklist">
              {content.checklist.map((item) => (
                <div className="dropshipping-checklist__item" key={item.title}>
                  <div className="dropshipping-checklist__title">{item.title}</div>
                  <div className="dropshipping-checklist__desc">{item.description}</div>
                </div>
              ))}
            </div>
          </aside>

          <section className="dropshipping-verification-main">
            {loadingStatus ? (
              <CustomSkeleton active paragraph={{ rows: 10 }} />
            ) : (
              <>
                {isApproved ? (
                  <CustomAlert
                    type="success"
                    showIcon={true}
                    message="این نقش قبلاً تایید شده است"
                    description="شما می‌توانید مستقیماً وارد پنل مربوطه شوید."
                    style={{ marginBottom: 20 }}
                  />
                ) : null}

                {isPending ? (
                  <CustomAlert
                    type="info"
                    showIcon={true}
                    message="درخواست شما در حال بررسی است"
                    description="تا زمان بررسی توسط ادمین، امکان ثبت مجدد وجود ندارد."
                    style={{ marginBottom: 20 }}
                  />
                ) : null}

                {isSuspended ? (
                  <CustomAlert
                    type="warning"
                    showIcon={true}
                    message="وضعیت این نقش تعلیق شده است"
                    description="برای فعال‌سازی مجدد لازم است ادمین وضعیت شما را از حالت تعلیق خارج کند."
                    style={{ marginBottom: 20 }}
                  />
                ) : null}

                {!isApproved && !isPending && !isSuspended ? (
                  <div>
                    <div className="dropshipping-form-grid">
                      <CustomFormItem
                        className="full-span"
                        label="نام و نام خانوادگی / نام حقوقی"
                        required
                        error={errors.legalName}
                      >
                        <CustomInput
                          value={formData.legalName}
                          onChange={(val) => handleFieldChange('legalName', val)}
                          placeholder="مثلاً شرکت نمونه تجارت"
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem
                        label="نام کسب‌وکار / برند"
                        required
                        error={errors.businessName}
                      >
                        <CustomInput
                          value={formData.businessName}
                          onChange={(val) => handleFieldChange('businessName', val)}
                          placeholder="مثلاً فروشگاه نمونه"
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem
                        label="نوع فعالیت"
                        required
                        error={errors.activityType}
                      >
                        <CustomSelect
                          value={formData.activityType}
                          onChange={(val) => handleFieldChange('activityType', val)}
                          placeholder="انتخاب کنید"
                          options={[
                            { label: 'حقیقی', value: 'individual' },
                            { label: 'حقوقی', value: 'company' },
                            { label: 'فروشگاه آنلاین', value: 'online_store' },
                            { label: 'توزیع‌کننده', value: 'distributor' }
                          ]}
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem
                        label="کد ملی / شناسه ملی"
                        required
                        error={errors.nationalCode}
                      >
                        <CustomInput
                          value={formData.nationalCode}
                          onChange={(val) => handleFieldChange('nationalCode', val)}
                          placeholder="مثلاً 1234567890"
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem
                        label="نام صاحب حساب"
                        required
                        error={errors.accountHolderName}
                      >
                        <CustomInput
                          value={formData.accountHolderName}
                          onChange={(val) => handleFieldChange('accountHolderName', val)}
                          placeholder="نام صاحب حساب"
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem
                        label="شماره شبا"
                        required
                        error={errors.iban}
                      >
                        <CustomInput
                          value={formData.iban}
                          onChange={(val) => handleFieldChange('iban', val)}
                          placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem
                        label="شماره کارت"
                        required
                        error={errors.cardNumber}
                      >
                        <CustomInput
                          value={formData.cardNumber}
                          onChange={(val) => handleFieldChange('cardNumber', val)}
                          placeholder="شماره کارت"
                          size="large"
                        />
                      </CustomFormItem>

                      <CustomFormItem className="full-span" label="توضیحات تکمیلی">
                        <CustomTextArea
                          value={formData.description}
                          onChange={(val) => handleFieldChange('description', val)}
                          placeholder="توضیح کوتاه درباره نوع فعالیت، مدل همکاری یا اطلاعات تکمیلی"
                          rows={5}
                        />
                      </CustomFormItem>

                      <CustomFormItem className="full-span" error={errors.acceptTerms}>
                        <CustomCheckbox
                          checked={formData.acceptTerms}
                          onChange={(val) => handleFieldChange('acceptTerms', val)}
                        >
                          قوانین همکاری دراپ‌شیپینگ را مطالعه کرده‌ام و با ثبت این درخواست موافقم.
                        </CustomCheckbox>
                      </CustomFormItem>
                    </div>

                    <div className="dropshipping-form-actions">
                      <button
                        type="submit"
                        className="dropshipping-primary-submit"
                        disabled={submitting}
                        onClick={onFinish}
                      >
                        {submitting ? 'در حال ثبت...' : 'ثبت درخواست تایید'}
                      </button>

                      <button
                        type="button"
                        className="dropshipping-secondary-submit"
                        onClick={() => navigate('/dashboard/dropshipping')}
                      >
                        بازگشت به داشبورد دراپ‌شیپینگ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dropshipping-form-actions">
                    <button
                      type="button"
                      className="dropshipping-primary-submit"
                      onClick={() =>
                        navigate(
                          role === 'provider'
                            ? '/dashboard/dropshipping/provider'
                            : '/dashboard/dropshipping/dropshipper'
                        )
                      }
                    >
                      {isApproved ? 'ورود به پنل' : 'بازگشت'}
                    </button>

                    <button
                      type="button"
                      className="dropshipping-secondary-submit"
                      onClick={() => navigate('/dashboard/dropshipping')}
                    >
                      بازگشت به صفحه اصلی دراپ‌شیپینگ
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default DropshippingVerification;