import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService, postService } from '../../../../services';

export default function NewMarketingRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [level2Categories, setLevel2Categories] = useState([]);
  const [level3Categories, setLevel3Categories] = useState([]);

  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    description: '',
    cityOfProduction: {
      province: '',
      city: '',
    },
    shippingTimeAvailable: {
      value: '',
      unit: 'days',
    },
    paymentTypes: [],
    commissionPercent: '',
    categories: {
      level1: '',
      level2: '',
      level3: '',
    },
  });

  const [priceVolumes, setPriceVolumes] = useState([
    { volume: '', pricePerUnit: '', unit: 'kg' },
  ]);

  const [specifications, setSpecifications] = useState([
    { key: '', value: '' },
  ]);

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [catalogue, setCatalogue] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      // Only get level 1 categories (root categories with no parent)
      const response = await postService.getCategories({ level: 1, parent: 'null' });
      // Backend returns { categories: [...] }
      const categoriesData = Array.isArray(response.data?.categories) ? response.data.categories : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Set empty array on error
      toast.error('خطا در بارگذاری دسته‌بندی‌ها');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategoryChange = async (level, value) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [`level${level}`]: value,
      },
    }));

    if (level === 1) {
      setFormData(prev => ({
        ...prev,
        categories: { level1: value, level2: '', level3: '' },
      }));
      setLevel2Categories([]);
      setLevel3Categories([]);
      
      if (value) {
        try {
          const response = await postService.getSubcategories(value);
          // Backend returns { subcategories: [...] }
          const subcategoriesData = Array.isArray(response.data?.subcategories) ? response.data.subcategories : [];
          setLevel2Categories(subcategoriesData);
        } catch (error) {
          console.error('Error loading subcategories:', error);
          setLevel2Categories([]); // Set empty array on error
        }
      }
    } else if (level === 2) {
      setFormData(prev => ({
        ...prev,
        categories: { ...prev.categories, level2: value, level3: '' },
      }));
      setLevel3Categories([]);
      
      if (value) {
        try {
          const response = await postService.getSubcategories(value);
          // Backend returns { subcategories: [...] }
          const subcategoriesData = Array.isArray(response.data?.subcategories) ? response.data.subcategories : [];
          setLevel3Categories(subcategoriesData);
        } catch (error) {
          console.error('Error loading subcategories:', error);
          setLevel3Categories([]); // Set empty array on error
        }
      }
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) {
      toast.error('حداکثر 8 تصویر می‌توانید آپلود کنید');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCatalogueChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم فایل کاتالوگ نباید بیش از 10 مگابایت باشد');
        return;
      }
      setCatalogue(file);
    }
  };

  const addPriceVolume = () => {
    setPriceVolumes([...priceVolumes, { volume: '', pricePerUnit: '', unit: 'kg' }]);
  };

  const removePriceVolume = (index) => {
    setPriceVolumes(priceVolumes.filter((_, i) => i !== index));
  };

  const updatePriceVolume = (index, field, value) => {
    const updated = [...priceVolumes];
    updated[index][field] = value;
    setPriceVolumes(updated);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const updateSpecification = (index, field, value) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const handlePaymentTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      paymentTypes: prev.paymentTypes.includes(type)
        ? prev.paymentTypes.filter(t => t !== type)
        : [...prev.paymentTypes, type],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.productName.trim()) {
      toast.error('لطفاً نام محصول را وارد کنید');
      return;
    }

    if (!formData.brand.trim()) {
      toast.error('لطفاً برند را وارد کنید');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('لطفاً توضیحات را وارد کنید');
      return;
    }

    if (!formData.categories.level1) {
      toast.error('لطفاً دسته سطح 1 را انتخاب کنید');
      return;
    }

    // Level 2 and 3 are optional, only validate if level 1 is selected
    if (formData.categories.level1 && !formData.categories.level2 && level2Categories.length > 0) {
      toast.error('لطفاً دسته سطح 2 را انتخاب کنید');
      return;
    }

    if (formData.categories.level2 && !formData.categories.level3 && level3Categories.length > 0) {
      toast.error('لطفاً دسته سطح 3 را انتخاب کنید');
      return;
    }

    if (!formData.commissionPercent || formData.commissionPercent <= 0) {
      toast.error('لطفاً درصد کمیسیون معتبر وارد کنید');
      return;
    }

    if (formData.paymentTypes.length === 0) {
      toast.error('لطفاً حداقل یک نوع پرداخت انتخاب کنید');
      return;
    }

    if (images.length === 0) {
      toast.error('لطفاً حداقل یک تصویر آپلود کنید');
      return;
    }

    if (priceVolumes.some(pv => !pv.volume || !pv.pricePerUnit)) {
      toast.error('لطفاً تمام قیمت‌های عمده‌فروشی را کامل کنید');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        priceVolumes: priceVolumes.filter(pv => pv.volume && pv.pricePerUnit),
        specifications: specifications.filter(s => s.key && s.value),
      };

      await marketingService.createMarketingRequest(data, images, catalogue);
      toast.success('درخواست بازاریابی با موفقیت ایجاد شد');
      navigate('/dashboard/marketing/my-requests');
    } catch (error) {
      console.error('Error creating marketing request:', error);
      toast.error(error.response?.data?.message || 'خطا در ایجاد درخواست بازاریابی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">ایجاد درخواست بازاریابی جدید</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">اطلاعات اولیه</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">نام محصول *</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">برند *</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">توضیحات *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">دسته‌بندی (سطح 1 الزامی است)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">دسته سطح 1</label>
              <select
                value={formData.categories.level1}
                onChange={(e) => handleCategoryChange(1, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                </option>
                {(categories || []).map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">دسته سطح 2</label>
              <select
                value={formData.categories.level2}
                onChange={(e) => handleCategoryChange(2, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.categories.level1}
              >
                <option value="">انتخاب کنید</option>
                {(level2Categories || []).map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">دسته سطح 3</label>
              <select
                value={formData.categories.level3}
                onChange={(e) => handleCategoryChange(3, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.categories.level2}
              >
                <option value="">انتخاب کنید</option>
                {(level3Categories || []).map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price Volumes */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">قیمت‌های عمده‌فروشی *</h2>
            <button
              type="button"
              onClick={addPriceVolume}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              افزودن قیمت
            </button>
          </div>

          {priceVolumes.map((pv, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">حجم</label>
                <input
                  type="number"
                  value={pv.volume}
                  onChange={(e) => updatePriceVolume(index, 'volume', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">قیمت واحد (تومان)</label>
                <input
                  type="number"
                  value={pv.pricePerUnit}
                  onChange={(e) => updatePriceVolume(index, 'pricePerUnit', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-2">واحد</label>
                <select
                  value={pv.unit}
                  onChange={(e) => updatePriceVolume(index, 'unit', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ton">تن</option>
                  <option value="kg">کیلوگرم</option>
                  <option value="gram">گرم</option>
                  <option value="piece">عدد</option>
                  <option value="pack">بسته</option>
                  <option value="box">جعبه</option>
                </select>
              </div>
              {priceVolumes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePriceVolume(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Location & Shipping */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">موقعیت و ارسال</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">استان تولید</label>
              <input
                type="text"
                value={formData.cityOfProduction.province}
                onChange={(e) => setFormData({
                  ...formData,
                  cityOfProduction: { ...formData.cityOfProduction, province: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">شهر تولید</label>
              <input
                type="text"
                value={formData.cityOfProduction.city}
                onChange={(e) => setFormData({
                  ...formData,
                  cityOfProduction: { ...formData.cityOfProduction, city: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">زمان آماده‌سازی ارسال</label>
              <input
                type="number"
                value={formData.shippingTimeAvailable.value}
                onChange={(e) => setFormData({
                  ...formData,
                  shippingTimeAvailable: { ...formData.shippingTimeAvailable, value: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">واحد زمانی</label>
              <select
                value={formData.shippingTimeAvailable.unit}
                onChange={(e) => setFormData({
                  ...formData,
                  shippingTimeAvailable: { ...formData.shippingTimeAvailable, unit: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="days">روز</option>
                <option value="weeks">هفته</option>
                <option value="months">ماه</option>
              </select>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">مشخصات</h2>
            <button
              type="button"
              onClick={addSpecification}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              افزودن مشخصه
            </button>
          </div>

          {specifications.map((spec, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">عنوان</label>
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: وزن"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">مقدار</label>
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 50 کیلوگرم"
                />
              </div>
              {specifications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Payment & Commission */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">نوع پرداخت و کمیسیون</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">نوع پرداخت *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.paymentTypes.includes('fobino_secure')}
                  onChange={() => handlePaymentTypeToggle('fobino_secure')}
                  className="w-4 h-4"
                />
                <span>پرداخت امن فوبینو</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.paymentTypes.includes('cash')}
                  onChange={() => handlePaymentTypeToggle('cash')}
                  className="w-4 h-4"
                />
                <span>نقدی</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">درصد کمیسیون بازاریاب *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionPercent}
                onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-gray-600">%</span>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">تصاویر * (حداکثر 8 تصویر)</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {images.length < 8 && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">آپلود تصویر</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Catalogue */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">کاتالوگ (اختیاری)</h2>
          
          <div>
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-600">
                {catalogue ? catalogue.name : 'آپلود فایل کاتالوگ (PDF, حداکثر 10MB)'}
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCatalogueChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد درخواست بازاریابی'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
