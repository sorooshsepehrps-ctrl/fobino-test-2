/* frontend/my-app/src/pages/dashboard/dropshipping/dropshipper/CreateRFPRequest.jsx */

import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import jalaliday from "jalali-plugin-dayjs";
import dropshippingService from '../../../../services/dropshippingService';

dayjs.extend(jalaliday);

// Custom Modal Component
const CustomModal = ({ open, onClose, onOk, confirmLoading, okText, cancelText, title, children }) => {
  if (!open) return null;

  return (
    <>
      <style>{`
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .custom-modal {
          background: #fff;
          border-radius: 24px;
          width: 760px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
        }

        .custom-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #eef2f7;
        }

        .custom-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #102766;
          margin: 0;
        }

        .custom-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .custom-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #eef2f7;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .custom-btn {
          padding: 8px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .custom-btn-primary {
          background: #102766;
          color: #fff;
        }

        .custom-btn-primary:hover:not(:disabled) {
          background: #183b8c;
          transform: translateY(-1px);
        }

        .custom-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .custom-btn-secondary {
          background: #f4f7fc;
          color: #5f6b7a;
        }

        .custom-btn-secondary:hover:not(:disabled) {
          background: #eef2f7;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="custom-modal-overlay" onClick={onClose}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
          <div className="custom-modal-header">
            <h2 className="custom-modal-title">{title}</h2>
          </div>
          <div className="custom-modal-body">{children}</div>
          <div className="custom-modal-footer">
            <button className="custom-btn custom-btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button className="custom-btn custom-btn-primary" onClick={onOk} disabled={confirmLoading}>
              {confirmLoading ? 'در حال ثبت...' : okText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Custom Form Components
const CustomInput = ({ value, onChange, placeholder, type = "text", rows = null, className = "" }) => {
  if (rows) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`custom-input ${className}`}
        style={{
          width: '100%',
          padding: '10px 14px',
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
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`custom-input ${className}`}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '14px',
        transition: 'all 0.2s',
        fontFamily: 'inherit'
      }}
      onFocus={(e) => e.target.style.borderColor = '#102766'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
    />
  );
};

const CustomInputNumber = ({ value, onChange, min = 1, className = "" }) => {
  const handleChange = (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) {
      onChange(min);
    } else {
      onChange(Math.max(min, val));
    }
  };

  return (
    <input
      type="number"
      value={value}
      onChange={handleChange}
      min={min}
      className={`custom-input-number ${className}`}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '14px',
        fontFamily: 'inherit'
      }}
    />
  );
};

const CustomDatePicker = ({ value, onChange, className = "", disabledDate }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  
  const handleSelect = (date) => {
    if (disabledDate && disabledDate(date)) return;
    onChange(date);
    setShowCalendar(false);
  };

  const formatJalali = (date) => {
    if (!date) return '';
    return date.calendar('jalali').format('YYYY/MM/DD');
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={formatJalali(value)}
        onClick={() => setShowCalendar(!showCalendar)}
        readOnly
        className={`custom-datepicker-input ${className}`}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          background: '#fff'
        }}
      />
      
      {showCalendar && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 100,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
        }}>
          {/* Simplified calendar - you can expand this */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}>←</button>
            <span style={{ margin: '0 16px' }}>{currentMonth.calendar('jalali').format('YYYY/MMMM')}</span>
            <button onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}>→</button>
          </div>
          <div style={{ minWidth: '200px' }}>
            <input
              type="date"
              onChange={(e) => handleSelect(dayjs(e.target.value))}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CustomFormItem = ({ label, children, required, error, className = "" }) => {
  return (
    <div className={`custom-form-item ${className}`} style={{ marginBottom: '16px' }}>
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

export default function CreateRFPRequest({ open, onClose, product, onCreated }) {
  const [formData, setFormData] = useState({
    quantity: null,
    agreedShipmentDate: null,
    recipientName: '',
    recipientPhone: '',
    shippingProvince: '',
    shippingCity: '',
    shippingAddress: '',
    postalCode: '',
    specialRequests: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const estimatedTotal = useMemo(() => {
    const quantity = Number(formData.quantity || 0);
    const price = Number(product?.retailPrice || 0);
    return quantity * price;
  }, [formData, product]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch(name) {
      case 'quantity':
        if (!value || value < 1) newErrors.quantity = 'تعداد الزامی است';
        else delete newErrors.quantity;
        break;
      case 'agreedShipmentDate':
        if (!value) newErrors.agreedShipmentDate = 'تاریخ ارسال توافقی الزامی است';
        else delete newErrors.agreedShipmentDate;
        break;
      case 'recipientName':
        if (!value?.trim()) newErrors.recipientName = 'نام گیرنده الزامی است';
        else delete newErrors.recipientName;
        break;
      case 'recipientPhone':
        if (!value?.trim()) newErrors.recipientPhone = 'شماره تماس الزامی است';
        else delete newErrors.recipientPhone;
        break;
      case 'shippingProvince':
        if (!value?.trim()) newErrors.shippingProvince = 'استان الزامی است';
        else delete newErrors.shippingProvince;
        break;
      case 'shippingCity':
        if (!value?.trim()) newErrors.shippingCity = 'شهر الزامی است';
        else delete newErrors.shippingCity;
        break;
      case 'shippingAddress':
        if (!value?.trim()) newErrors.shippingAddress = 'آدرس الزامی است';
        else delete newErrors.shippingAddress;
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    const fields = ['quantity', 'agreedShipmentDate', 'recipientName', 'recipientPhone', 
                    'shippingProvince', 'shippingCity', 'shippingAddress'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);

      const agreedShipmentDate = formData.agreedShipmentDate?.toDate?.() || formData.agreedShipmentDate;
      const agreedShipmentDateJalali = dayjs(formData.agreedShipmentDate).calendar('jalali').format('YYYY/MM/DD');

      await dropshippingService.createRFP({
        product: product._id,
        quantity: formData.quantity,
        shippingLocation: {
          province: formData.shippingProvince,
          city: formData.shippingCity,
          address: formData.shippingAddress,
          postalCode: formData.postalCode,
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone
        },
        proposedTerms: {
          specialRequests: formData.specialRequests || ''
        },
        agreedShipmentDate,
        agreedShipmentDateJalali
      });

      alert('RFP با موفقیت ثبت شد');
      
      setFormData({
        quantity: null,
        agreedShipmentDate: null,
        recipientName: '',
        recipientPhone: '',
        shippingProvince: '',
        shippingCity: '',
        shippingAddress: '',
        postalCode: '',
        specialRequests: ''
      });
      setErrors({});
      onCreated?.();
      onClose?.();
    } catch (err) {
      console.error('Error creating RFP:', err);
      alert(err?.message || 'ثبت RFP با مشکل مواجه شد');
    } finally {
      setSubmitting(false);
    }
  };

  const pageStyles = `
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .mt-16 {
      margin-top: 16px;
    }
    
    .mb-16 {
      margin-bottom: 16px;
    }
    
    .w-full {
      width: 100%;
    }
    
    .rfp-form-intro p {
      color: #5f6b7a;
      line-height: 1.6;
      margin: 0;
    }
    
    .finance-preview-card {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border: 1px solid #eef2f7;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }
    
    .finance-preview-card span {
      color: #5f6b7a;
      font-size: 14px;
    }
    
    .finance-preview-card strong {
      color: #102766;
      font-size: 18px;
      font-weight: 800;
    }
    
    @media (max-width: 640px) {
      .two-col-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      
      <CustomModal
        open={open}
        onClose={onClose}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="ثبت RFP"
        cancelText="انصراف"
        title="ایجاد درخواست همکاری دراپ‌شیپینگ"
      >
        <div className="rfp-form-intro mb-16">
          <p>
            با ثبت RFP، قیمت محصول، تعداد، آدرس ارسال و تاریخ ارسال توافقی برای همکاری ثبت می‌شود.
          </p>
        </div>

        <div className="two-col-grid">
          <CustomFormItem label="تعداد" required error={errors.quantity}>
            <CustomInputNumber
              value={formData.quantity}
              onChange={(val) => handleFieldChange('quantity', val)}
              min={1}
              className="w-full"
            />
          </CustomFormItem>

          <CustomFormItem label="تاریخ ارسال توافقی" required error={errors.agreedShipmentDate}>
            <CustomDatePicker
              value={formData.agreedShipmentDate}
              onChange={(date) => handleFieldChange('agreedShipmentDate', date)}
              className="w-full"
              disabledDate={(date) => date && date < dayjs().startOf('day')}
            />
          </CustomFormItem>
        </div>

        <div className="two-col-grid">
          <CustomFormItem label="نام گیرنده" required error={errors.recipientName}>
            <CustomInput
              value={formData.recipientName}
              onChange={(val) => handleFieldChange('recipientName', val)}
              placeholder="نام گیرنده"
            />
          </CustomFormItem>
          
          <CustomFormItem label="شماره تماس گیرنده" required error={errors.recipientPhone}>
            <CustomInput
              value={formData.recipientPhone}
              onChange={(val) => handleFieldChange('recipientPhone', val)}
              placeholder="شماره تماس"
            />
          </CustomFormItem>
        </div>

        <div className="two-col-grid">
          <CustomFormItem label="استان" required error={errors.shippingProvince}>
            <CustomInput
              value={formData.shippingProvince}
              onChange={(val) => handleFieldChange('shippingProvince', val)}
              placeholder="استان"
            />
          </CustomFormItem>
          
          <CustomFormItem label="شهر" required error={errors.shippingCity}>
            <CustomInput
              value={formData.shippingCity}
              onChange={(val) => handleFieldChange('shippingCity', val)}
              placeholder="شهر"
            />
          </CustomFormItem>
        </div>

        <CustomFormItem label="آدرس" required error={errors.shippingAddress}>
          <CustomInput
            value={formData.shippingAddress}
            onChange={(val) => handleFieldChange('shippingAddress', val)}
            placeholder="آدرس"
            rows={3}
          />
        </CustomFormItem>

        <CustomFormItem label="کد پستی">
          <CustomInput
            value={formData.postalCode}
            onChange={(val) => handleFieldChange('postalCode', val)}
            placeholder="کد پستی"
          />
        </CustomFormItem>

        <CustomFormItem label="توضیحات یا درخواست خاص">
          <CustomInput
            value={formData.specialRequests}
            onChange={(val) => handleFieldChange('specialRequests', val)}
            placeholder="توضیحات یا درخواست خاص"
            rows={4}
          />
        </CustomFormItem>

        <div className="finance-preview-card">
          <span>مبلغ تقریبی این درخواست</span>
          <strong>{estimatedTotal.toLocaleString('fa-IR')} تومان</strong>
        </div>
      </CustomModal>
    </>
  );
}

// import React, { useMemo, useState } from 'react';
// import { DatePicker, Form, Input, InputNumber, Modal, message } from 'antd';
// import dayjs from 'dayjs';
// import jalaliday from 'jalaliday';
// import { createRFP } from '../../../../services/dropshippingService';

// dayjs.extend(jalaliday);

// const { TextArea } = Input;

// export default function CreateRFPRequest({ open, onClose, product, onCreated }) {
//   const [form] = Form.useForm();
//   const [submitting, setSubmitting] = useState(false);

//   const estimatedTotal = useMemo(() => {
//     const quantity = Number(form.getFieldValue('quantity') || 0);
//     const price = Number(product?.retailPrice || 0);
//     return quantity * price;
//   }, [form, product]);

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
//       setSubmitting(true);

//       const agreedShipmentDate = values.agreedShipmentDate?.toDate?.() || values.agreedShipmentDate;
//       const agreedShipmentDateJalali = dayjs(values.agreedShipmentDate).calendar('jalali').format('YYYY/MM/DD');

//       await createRFP({
//         product: product._id,
//         quantity: values.quantity,
//         shippingLocation: {
//           province: values.shippingProvince,
//           city: values.shippingCity,
//           address: values.shippingAddress,
//           postalCode: values.postalCode,
//           recipientName: values.recipientName,
//           recipientPhone: values.recipientPhone
//         },
//         proposedTerms: {
//           specialRequests: values.specialRequests || ''
//         },
//         agreedShipmentDate,
//         agreedShipmentDateJalali
//       });

//       message.success('RFP با موفقیت ثبت شد');
//       form.resetFields();
//       onCreated?.();
//       onClose?.();
//     } catch (err) {
//       if (err?.errorFields) return;
//       console.error(err);
//       message.error('ثبت RFP با مشکل مواجه شد');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       onCancel={onClose}
//       onOk={handleSubmit}
//       confirmLoading={submitting}
//       okText="ثبت RFP"
//       cancelText="انصراف"
//       width={760}
//       title="ایجاد درخواست همکاری دراپ‌شیپینگ"
//     >
//       <div className="rfp-form-intro mb-16">
//         <p>
//           با ثبت RFP، قیمت محصول، تعداد، آدرس ارسال و تاریخ ارسال توافقی برای همکاری ثبت می‌شود.
//         </p>
//       </div>

//       <Form form={form} layout="vertical">
//         <div className="two-col-grid">
//           <Form.Item name="quantity" label="تعداد" rules={[{ required: true, message: 'تعداد الزامی است' }]}>
//             <InputNumber min={1} className="w-full" />
//           </Form.Item>

//           <Form.Item
//             name="agreedShipmentDate"
//             label="تاریخ ارسال توافقی"
//             rules={[{ required: true, message: 'تاریخ ارسال توافقی الزامی است' }]}
//           >
//             <DatePicker className="w-full" disabledDate={(date) => date && date < dayjs().startOf('day')} />
//           </Form.Item>
//         </div>

//         <div className="two-col-grid">
//           <Form.Item name="recipientName" label="نام گیرنده" rules={[{ required: true, message: 'نام گیرنده الزامی است' }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="recipientPhone" label="شماره تماس گیرنده" rules={[{ required: true, message: 'شماره تماس الزامی است' }]}>
//             <Input />
//           </Form.Item>
//         </div>

//         <div className="two-col-grid">
//           <Form.Item name="shippingProvince" label="استان" rules={[{ required: true, message: 'استان الزامی است' }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="shippingCity" label="شهر" rules={[{ required: true, message: 'شهر الزامی است' }]}>
//             <Input />
//           </Form.Item>
//         </div>

//         <Form.Item name="shippingAddress" label="آدرس" rules={[{ required: true, message: 'آدرس الزامی است' }]}>
//           <TextArea rows={3} />
//         </Form.Item>

//         <Form.Item name="postalCode" label="کد پستی">
//           <Input />
//         </Form.Item>

//         <Form.Item name="specialRequests" label="توضیحات یا درخواست خاص">
//           <TextArea rows={4} />
//         </Form.Item>
//       </Form>

//       <div className="finance-preview-card mt-16">
//         <span>مبلغ تقریبی این درخواست</span>
//         <strong>{estimatedTotal.toLocaleString('fa-IR')} تومان</strong>
//       </div>
//     </Modal>
//   );
// }