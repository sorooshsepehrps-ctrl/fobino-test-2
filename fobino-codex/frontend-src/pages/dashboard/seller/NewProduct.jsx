import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  X, 
  Upload,
  MapPin,
  DollarSign,
  Calendar,
  Tag,
  Info,
  CheckCircle
} from 'lucide-react';
import { Card, Button, Input } from '../../../components/ui';
import { postService } from '../../../services';
import useAuthStore from '../../../store/authStore';
import { PROVINCES } from '../../../config/constants';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [thirdLevelCategories, setThirdLevelCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [keyFeatures, setKeyFeatures] = useState(['']);
  const [keywords, setKeywords] = useState(['']);
  const [paymentMethods, setPaymentMethods] = useState(['cash']);
  
  // Common fields
  const [formData, setFormData] = useState({
    type: '', // 'sell' | 'buy'
    title: '',
    description: '',
    categoryLevel1: '',
    categoryLevel2: '',
    categoryLevel3: '',
    expiresAt: '',
    status: 'draft',
    isInternational: false,
    currencies: [],
    
    // Sell post fields
    productName: '',
    brand: '',
    productType: 'new',
    province: '',
    city: '',
    address: '',
    dropShipping: false,
    needsMarketer: false,
    marketerPercentage: 0,
    unit: '',
    availableQuantity: '',
    minOrder: '',
    minPricePerUnit: '',
    maxPricePerUnit: '',
    hasDiscount: false,
    discountPercentage: '',
    discountUntil: '',
    
    // Buy post fields
    neededProductName: '',
    neededProductType: '',
    neededQuantity: '',
    neededUnit: '',
    usageType: 'domestic',
    requestExpiry: '',
    deliveryProvince: '',
    deliveryCity: '',
    deliveryAddress: '',
    maxBudget: '',
    additionalRequirements: ''
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await postService.getCategories();
      if (response.success) {
        // Filter to show only level 1 categories in the first dropdown
        const level1Categories = response.data.categories.filter(cat => cat.level === 1);
        setCategories(level1Categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle category changes
  const handleCategory1Change = async (value) => {
    setFormData(prev => ({ ...prev, categoryLevel1: value, categoryLevel2: '', categoryLevel3: '' }));
    setSubcategories([]);
    setThirdLevelCategories([]);
    
    if (value) {
      try {
        const response = await postService.getSubcategories(value);
        if (response.success) {
          setSubcategories(response.data.subcategories || []);
        }
      } catch (error) {
        console.error('Error loading subcategories:', error);
      }
    }
  };

  const handleCategory2Change = async (value) => {
    setFormData(prev => ({ ...prev, categoryLevel2: value, categoryLevel3: '' }));
    setThirdLevelCategories([]);
    
    if (value) {
      try {
        const response = await postService.getSubcategories(value);
        if (response.success) {
          setThirdLevelCategories(response.data.subcategories || []);
        }
      } catch (error) {
        console.error('Error loading third level categories:', error);
      }
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle array fields
  const addArrayItem = (field, setter) => {
    setter(prev => [...prev, '']);
  };

  const removeArrayItem = (index, field, setter) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const updateArrayItem = (index, value, field, setter) => {
    setter(prev => prev.map((item, i) => i === index ? value : item));
  };

  // Form validation
  const validateStep = () => {
    if (step === 1) {
      return formData.type;
    }
    if (step === 2) {
      return formData.title && formData.description && formData.categoryLevel1;
    }
    if (step === 3) {
      if (formData.type === 'sell') {
        return formData.productName && formData.brand && formData.province && 
               formData.city && formData.unit && formData.availableQuantity && 
               formData.minOrder && formData.minPricePerUnit && formData.maxPricePerUnit;
      } else {
        return formData.neededProductName && formData.neededProductType && 
               formData.neededQuantity && formData.neededUnit && formData.usageType && 
               formData.deliveryProvince && formData.deliveryCity;
      }
    }
    return true;
  };

  // Complete form validation for submission
  const validateCompleteForm = () => {
    // Basic required fields for all posts
    if (!formData.type) {
      alert('لطفا نوع آگهی را انتخاب کنید');
      return false;
    }
    
    if (!formData.title || formData.title.trim().length < 5) {
      alert('عنوان آگهی باید حداقل ۵ کاراکتر باشد');
      return false;
    }
    
    if (!formData.description || formData.description.trim().length < 20) {
      alert('توضیحات آگهی باید حداقل ۲۰ کاراکتر باشد');
      return false;
    }
    
    if (!formData.categoryLevel1) {
      alert('لطفا دسته‌بندی اصلی را انتخاب کنید');
      return false;
    }
    
    // Type-specific validation
    if (formData.type === 'sell') {
      if (!formData.productName || !formData.brand || !formData.province || 
          !formData.city || !formData.unit || !formData.availableQuantity || 
          !formData.minOrder || !formData.minPricePerUnit) {
        alert('لطفا تمام فیلدهای ضروری آگهی فروش را تکمیل کنید');
        return false;
      }
    } else if (formData.type === 'buy') {
      if (!formData.neededProductName || !formData.neededProductType || 
          !formData.neededQuantity || !formData.neededUnit || !formData.usageType || 
          !formData.deliveryProvince || !formData.deliveryCity) {
        alert('لطفا تمام فیلدهای ضروری درخواست خرید را تکمیل کنید');
        return false;
      }
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (publish = false) => {
    if (!validateCompleteForm()) return;
    
    setLoading(true);
    try {
      const submissionData = { ...formData, status: publish ? 'active' : 'draft' };
      
      // Clean up and prepare array fields
      submissionData.keyFeatures = keyFeatures.filter(f => f.trim());
      submissionData.keywords = keywords.filter(k => k.trim());
      
      // Only include buy-specific fields for buy posts
      if (formData.type === 'buy') {
        submissionData.paymentMethods = paymentMethods;
      } else {
        // Remove buy-specific fields for sell posts
        delete submissionData.paymentMethods;
        delete submissionData.usageType;
        delete submissionData.requestExpiry;
        delete submissionData.deliveryProvince;
        delete submissionData.deliveryCity;
        delete submissionData.deliveryAddress;
        delete submissionData.maxBudget;
        delete submissionData.additionalRequirements;
        delete submissionData.neededProductName;
        delete submissionData.neededProductType;
        delete submissionData.neededQuantity;
        delete submissionData.neededUnit;
      }
      
      // Handle discount fields - only include if discount is enabled
      if (!formData.hasDiscount) {
        delete submissionData.discountPercentage;
        delete submissionData.discountUntil;
      }
      
      // Remove empty optional fields to avoid validation errors
      if (!submissionData.keyFeatures.length) {
        delete submissionData.keyFeatures;
      }
      if (!submissionData.keywords.length) {
        delete submissionData.keywords;
      }
      if (!submissionData.currencies || !submissionData.currencies.length) {
        delete submissionData.currencies;
      }
      if (!submissionData.expiresAt) {
        delete submissionData.expiresAt;
      }
      
      console.log('Submitting data:', submissionData); // Debug log
      const response = await postService.createPost(submissionData, images);
      
      if (response.success) {
        navigate('/dashboard/products', { 
          state: { message: publish ? 'آگهی با موفقیت منتشر شد' : 'آگهی به عنوان پیش‌نویس ذخیره شد' }
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('خطا در ایجاد آگهی');
    } finally {
      setLoading(false);
    }
  };

  // Step components
  const renderStep1 = () => (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Package className="w-6 h-6" />
        نوع آگهی را انتخاب کنید
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setFormData(prev => ({ ...prev, type: 'sell' }))}
          className={`p-6 rounded-lg border-2 transition-all ${
            formData.type === 'sell' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <h3 className="font-bold text-lg mb-2">آگهی فروش</h3>
            <p className="text-gray-600 text-sm">محصول یا خدماتی را برای فروش عرضه کنید</p>
          </div>
        </button>
        
        <button
          onClick={() => setFormData(prev => ({ ...prev, type: 'buy' }))}
          className={`p-6 rounded-lg border-2 transition-all ${
            formData.type === 'buy' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-center">
            <Tag className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <h3 className="font-bold text-lg mb-2">درخواست خرید</h3>
            <p className="text-gray-600 text-sm">نیاز خود را برای خرید اعلام کنید</p>
          </div>
        </button>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6">اطلاعات اصلی آگهی</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان آگهی *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="عنوان جذاب و دقیق برای آگهی خود"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات کامل *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="توضیحات کامل محصول یا خدمت خود را بنویسید"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی اصلی *</label>
            <select
              value={formData.categoryLevel1}
              onChange={(e) => handleCategory1Change(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">انتخاب کنید</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی دوم</label>
            <select
              value={formData.categoryLevel2}
              onChange={(e) => handleCategory2Change(e.target.value)}
              disabled={!formData.categoryLevel1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">انتخاب کنید</option>
              {subcategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی سوم</label>
            <select
              value={formData.categoryLevel3}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryLevel3: e.target.value }))}
              disabled={!formData.categoryLevel2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">انتخاب کنید</option>
              {thirdLevelCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">مدت اعتبار آگهی</label>
          <input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">تصاویر آگهی</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">برای آپلود تصویر کلیک کنید (حداکثر 5 تصویر)</span>
            </label>
            
            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6">
        {formData.type === 'sell' ? 'اطلاعات محصول برای فروش' : 'اطلاعات درخواست خرید'}
      </h2>
      
      <div className="space-y-4">
        {formData.type === 'sell' ? (
          // Sell post fields
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام محصول *</label>
                <Input
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="نام دقیق محصول"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">برند *</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="برند محصول"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع محصول</label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="new">نو</option>
                <option value="used">کارکرده</option>
                <option value="refurbished">بازسازی شده</option>
              </select>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">استان *</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value, city: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">انتخاب کنید</option>
                  {PROVINCES.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شهر *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="شهر خود را وارد کنید"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">واحد *</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="مثال: کیلوگرم، عدد، متر"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس دقیق</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="آدرس دقیق محل تحویل محصول"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موجودی *</label>
                <Input
                  type="number"
                  value={formData.availableQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableQuantity: e.target.value }))}
                  placeholder="تعداد موجود"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حداقل سفارش *</label>
                <Input
                  type="number"
                  value={formData.minOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrder: e.target.value }))}
                  placeholder="حداقل تعداد سفارش"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قیمت واحد *</label>
                <Input
                  type="number"
                  value={formData.minPricePerUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, minPricePerUnit: e.target.value }))}
                  placeholder="قیمت به تومان"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حداکثر قیمت واحد</label>
              <Input
                type="number"
                value={formData.maxPricePerUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, maxPricePerUnit: e.target.value }))}
                placeholder="در صورت وجود محدوده قیمتی"
              />
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.dropShipping}
                  onChange={(e) => setFormData(prev => ({ ...prev, dropShipping: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">امکان ارسال مستقیم (دراپ‌شپینگ)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.needsMarketer}
                  onChange={(e) => setFormData(prev => ({ ...prev, needsMarketer: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">نیاز به بازاریاب</span>
              </label>
              
              {formData.needsMarketer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">درصد بازاریاب</label>
                  <Input
                    type="number"
                    value={formData.marketerPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketerPercentage: e.target.value }))}
                    placeholder="درصد کمیسیون بازاریاب"
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          // Buy post fields
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام محصول مورد نیاز *</label>
                <Input
                  value={formData.neededProductName}
                  onChange={(e) => setFormData(prev => ({ ...prev, neededProductName: e.target.value }))}
                  placeholder="نام محصولی که نیاز دارید"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع محصول *</label>
                <Input
                  value={formData.neededProductType}
                  onChange={(e) => setFormData(prev => ({ ...prev, neededProductType: e.target.value }))}
                  placeholder="نوع یا مدل محصول"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تعداد مورد نیاز *</label>
                <Input
                  type="number"
                  value={formData.neededQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, neededQuantity: e.target.value }))}
                  placeholder="تعداد"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">واحد *</label>
                <Input
                  value={formData.neededUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, neededUnit: e.target.value }))}
                  placeholder="مثال: کیلوگرم، عدد، متر"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">بودجه حداکثر</label>
                <Input
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBudget: e.target.value }))}
                  placeholder="بودجه به تومان"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع استفاده *</label>
              <select
                value={formData.usageType}
                onChange={(e) => setFormData(prev => ({ ...prev, usageType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="domestic">مصرف داخلی</option>
                <option value="commercial">مصرف تجاری</option>
                <option value="export">صادرات</option>
              </select>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">استان تحویل *</label>
                <select
                  value={formData.deliveryProvince}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryProvince: e.target.value, deliveryCity: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">انتخاب کنید</option>
                  {PROVINCES.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شهر تحویل *</label>
                <Input
                  value={formData.deliveryCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryCity: e.target.value }))}
                  placeholder="شهر تحویل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اعتبار درخواست</label>
                <input
                  type="date"
                  value={formData.requestExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestExpiry: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس تحویل</label>
              <textarea
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                placeholder="آدرس دقیق محل تحویل"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نیازهای اضافی</label>
              <textarea
                value={formData.additionalRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                placeholder="توضیحات اضافی در مورد نیاز خود"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">روش‌های پرداخت</label>
              <div className="space-y-2">
                {['cash', 'credit', 'tahator', 'fobino_secure'].map(method => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paymentMethods.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentMethods(prev => [...prev, method]);
                        } else {
                          setPaymentMethods(prev => prev.filter(m => m !== method));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {method === 'cash' && 'نقدی'}
                      {method === 'credit' && 'اعتباری'}
                      {method === 'tahator' && 'تاهاتور'}
                      {method === 'fobino_secure' && 'فوبینو سکیور'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6">اطلاعات تکمیلی</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ویژگی‌های کلیدی</label>
          {keyFeatures.map((feature, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                value={feature}
                onChange={(e) => updateArrayItem(index, e.target.value, 'keyFeatures', setKeyFeatures)}
                placeholder="ویژگی کلیدی محصول"
                className="flex-1"
              />
              {keyFeatures.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(index, 'keyFeatures', setKeyFeatures)}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('keyFeatures', setKeyFeatures)}
            className="mt-2"
          >
            <Plus size={16} className="ml-1" />
            افزودن ویژگی
          </Button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">کلمات کلیدی</label>
          {keywords.map((keyword, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                value={keyword}
                onChange={(e) => updateArrayItem(index, e.target.value, 'keywords', setKeywords)}
                placeholder="کلمه کلیدی برای جستجو"
                className="flex-1"
              />
              {keywords.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(index, 'keywords', setKeywords)}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('keywords', setKeywords)}
            className="mt-2"
          >
            <Plus size={16} className="ml-1" />
            افزودن کلمه کلیدی
          </Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            پیش‌نمایش آگهی
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>نوع:</strong> {formData.type === 'sell' ? 'فروش' : 'خرید'}</p>
            <p><strong>عنوان:</strong> {formData.title || '---'}</p>
            <p><strong>دسته‌بندی:</strong> {categories.find(c => c._id === formData.categoryLevel1)?.name || '---'}</p>
            {formData.type === 'sell' ? (
              <>
                <p><strong>محصول:</strong> {formData.productName || '---'}</p>
                <p><strong>برند:</strong> {formData.brand || '---'}</p>
                <p><strong>قیمت:</strong> {formData.minPricePerUnit ? `${formData.minPricePerUnit} تومان` : '---'}</p>
              </>
            ) : (
              <>
                <p><strong>محصول مورد نیاز:</strong> {formData.neededProductName || '---'}</p>
                <p><strong>تعداد:</strong> {formData.neededQuantity || '---'}</p>
                <p><strong>بودجه:</strong> {formData.maxBudget ? `${formData.maxBudget} تومان` : '---'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Navigation
  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    } else {
      alert('لطفاً تمام فیلدهای الزامی را پر کنید');
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ایجاد آگهی جدید</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          مرحله {step} از 4
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <div>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={loading}
            >
              <ArrowLeft size={16} className="ml-2" />
              مرحله قبل
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {step < 4 ? (
            <Button
              onClick={nextStep}
              disabled={loading || !validateStep()}
            >
              مرحله بعد
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                ذخیره به عنوان پیش‌نویس
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={16} className="ml-2" />
                منتشر کردن آگهی
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
