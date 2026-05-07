import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardHeader, CardTitle } from '../../components/ui';
import { ticketService } from '../../services';

const categories = [
  { value: 'technical', label: 'مشکل فنی' },
  { value: 'payment', label: 'مالی و پرداخت' },
  { value: 'account', label: 'حساب کاربری' },
  { value: 'verification', label: 'احراز هویت' },
  { value: 'post', label: 'آگهی و محصولات' },
  { value: 'deal', label: 'معاملات' },
  { value: 'suggestion', label: 'پیشنهاد و انتقاد' },
  { value: 'other', label: 'سایر' },
];

const priorities = [
  { value: 'low', label: 'کم' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'زیاد' },
  { value: 'urgent', label: 'فوری' },
];

export default function NewTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error('حداکثر ۵ فایل می‌توانید آپلود کنید');
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.category || !formData.message) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.createTicket(formData, files);
      toast.success('تیکت با موفقیت ثبت شد');
      navigate('/dashboard/tickets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ثبت تیکت');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/tickets')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">ایجاد تیکت جدید</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات تیکت</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label="موضوع"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="موضوع تیکت را وارد کنید"
              required
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  دسته‌بندی <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">انتخاب کنید</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اولویت
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                متن پیام <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                required
                placeholder="مشکل یا درخواست خود را شرح دهید..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* File attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                فایل پیوست (اختیاری)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <label className="flex flex-col items-center cursor-pointer">
                  <span className="text-sm text-gray-500">
                    فایل‌ها را اینجا بکشید یا کلیک کنید
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    حداکثر ۵ فایل، هر کدام تا ۵ مگابایت
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                loading={submitting}
                icon={Send}
                size="lg"
              >
                ارسال تیکت
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
