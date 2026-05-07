import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Save, Send } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import postService from '../../../services/postService';
import {
  buildCreatePostPayload,
  createInitialPostForm,
  getCategoryChildren,
  getWizardSteps,
  validateWizardStep,
  WIZARD_STEP_KEYS,
} from '../../../utils/postDashboard';
import PostWizardHeader from './PostWizardHeader';
import PostWizardSteps from './PostWizardSteps';
import PostTypeStep from './steps/PostTypeStep';
import PostCategoryStep from './steps/PostCategoryStep';
import PostGeneralInfoStep from './steps/PostGeneralInfoStep';
import SellPostDetailsStep from './steps/SellPostDetailsStep';
import BuyPostDetailsStep from './steps/BuyPostDetailsStep';
import PostReviewStep from './steps/PostReviewStep';

export default function PostWizard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialType = searchParams.get('type') === 'buy' ? 'buy' : 'sell';

  const [form, setForm] = useState(createInitialPostForm(initialType));
  const [tree, setTree] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const steps = useMemo(() => getWizardSteps(form.type), [form.type]);
  const activeStep = steps[currentStep];

  const selectedLevel1 = useMemo(
    () => tree.find((item) => item._id === form.categoryLevel1) || null,
    [tree, form.categoryLevel1]
  );

  const selectedLevel2 = useMemo(
    () => getCategoryChildren(selectedLevel1).find((item) => item._id === form.categoryLevel2) || null,
    [selectedLevel1, form.categoryLevel2]
  );

  const selectedLevel3 = useMemo(
    () => getCategoryChildren(selectedLevel2).find((item) => item._id === form.categoryLevel3) || null,
    [selectedLevel2, form.categoryLevel3]
  );

  const selectedCategoryPath = [
    selectedLevel1?.name,
    selectedLevel2?.name,
    selectedLevel3?.name,
  ]
    .filter(Boolean)
    .join(' / ');

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const response = await postService.getCategoriesTree();
        if (!mounted) return;
        setTree(response?.data?.categories || []);
      } catch (error) {
        console.error(error);
        toast.error('دریافت دسته‌بندی‌ها با خطا مواجه شد');
      } finally {
        if (mounted) setIsCategoriesLoading(false);
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setType = (type) => {
    setForm((prev) => ({
      ...createInitialPostForm(type),
      categoryLevel1: prev.categoryLevel1,
      categoryLevel2: prev.categoryLevel2,
      categoryLevel3: prev.categoryLevel3,
    }));

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('type', type);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectLevel1 = (category) => {
    setForm((prev) => ({
      ...prev,
      categoryLevel1: category?._id || '',
      categoryLevel2: '',
      categoryLevel3: '',
    }));
  };

  const handleSelectLevel2 = (category) => {
    setForm((prev) => ({
      ...prev,
      categoryLevel2: category?._id || '',
      categoryLevel3: '',
    }));
  };

  const handleSelectLevel3 = (category) => {
    setForm((prev) => ({
      ...prev,
      categoryLevel3: category?._id || '',
    }));
  };

  const handleFeatureAdd = () => {
    setForm((prev) => ({
      ...prev,
      keyFeatures: [...prev.keyFeatures, { name: '', value: '' }],
    }));
  };

  const handleFeatureRemove = (index) => {
    setForm((prev) => {
      if (prev.keyFeatures.length === 1) return prev;
      return {
        ...prev,
        keyFeatures: prev.keyFeatures.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleFeatureChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const togglePaymentMethod = (method) => {
    setForm((prev) => {
      const exists = prev.paymentMethods.includes(method);
      const nextMethods = exists
        ? prev.paymentMethods.filter((item) => item !== method)
        : [...prev.paymentMethods, method];

      return {
        ...prev,
        paymentMethods: nextMethods.length ? nextMethods : ['cash'],
      };
    });
  };

  const nextStep = () => {
    const errorMessage = validateWizardStep(form, activeStep?.key);
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goToReview = () => {
    const keysToValidate = [
      WIZARD_STEP_KEYS.type,
      WIZARD_STEP_KEYS.category,
      WIZARD_STEP_KEYS.general,
      WIZARD_STEP_KEYS.details,
    ];

    for (const key of keysToValidate) {
      const errorMessage = validateWizardStep(form, key);
      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }
    }

    setCurrentStep(steps.findIndex((item) => item.key === WIZARD_STEP_KEYS.review));
  };

  const submitForm = async (mode) => {
    const keysToValidate = [
      WIZARD_STEP_KEYS.type,
      WIZARD_STEP_KEYS.category,
      WIZARD_STEP_KEYS.general,
      WIZARD_STEP_KEYS.details,
    ];

    for (const key of keysToValidate) {
      const errorMessage = validateWizardStep(form, key);
      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }
    }

    const payload = buildCreatePostPayload(form, mode);

    try {
      if (mode === 'draft') {
        setIsSavingDraft(true);
      } else {
        setIsPublishing(true);
      }

      const response = await postService.createPost(payload);
      const createdPost = response?.data || response?.post || null;

      toast.success(mode === 'draft' ? 'پیش‌نویس با موفقیت ذخیره شد' : 'آگهی با موفقیت ثبت شد');

      if (createdPost?._id) {
        navigate('/dashboard/my-posts');
        return;
      }

      navigate('/dashboard/my-posts');
    } catch (error) {
      console.error(error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'ثبت آگهی با خطا مواجه شد';
      toast.error(serverMessage);
    } finally {
      setIsSavingDraft(false);
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PostWizardHeader type={form.type} />

      <PostWizardSteps steps={steps} currentStep={currentStep} />

      {activeStep?.key === WIZARD_STEP_KEYS.type ? (
        <PostTypeStep value={form.type} onChange={setType} />
      ) : null}

      {activeStep?.key === WIZARD_STEP_KEYS.category ? (
        isCategoriesLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.22)]">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <p className="text-sm font-bold text-slate-700">در حال بارگذاری دسته‌بندی‌ها...</p>
            </div>
          </div>
        ) : (
          <PostCategoryStep
            tree={tree}
            form={form}
            onSelectLevel1={handleSelectLevel1}
            onSelectLevel2={handleSelectLevel2}
            onSelectLevel3={handleSelectLevel3}
          />
        )
      ) : null}

      {activeStep?.key === WIZARD_STEP_KEYS.general ? (
        <PostGeneralInfoStep form={form} onChange={setField} />
      ) : null}

      {activeStep?.key === WIZARD_STEP_KEYS.details && form.type === 'sell' ? (
        <SellPostDetailsStep
          form={form}
          onChange={setField}
          onFeatureAdd={handleFeatureAdd}
          onFeatureRemove={handleFeatureRemove}
          onFeatureChange={handleFeatureChange}
        />
      ) : null}

      {activeStep?.key === WIZARD_STEP_KEYS.details && form.type === 'buy' ? (
        <BuyPostDetailsStep
          form={form}
          onChange={setField}
          onTogglePaymentMethod={togglePaymentMethod}
        />
      ) : null}

      {activeStep?.key === WIZARD_STEP_KEYS.review ? (
        <PostReviewStep form={form} selectedCategoryPath={selectedCategoryPath} />
      ) : null}

      <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)] md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0 || isSavingDraft || isPublishing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRight className="h-4 w-4" />
          مرحله قبل
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {currentStep < steps.length - 1 ? (
            <>
              <button
                type="button"
                onClick={goToReview}
                disabled={isSavingDraft || isPublishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              >
                <Save className="h-4 w-4" />
                مرور نهایی
              </button>

              <button
                type="button"
                onClick={nextStep}
                disabled={isSavingDraft || isPublishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.78)]"
              >
                مرحله بعد
                <ArrowLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submitForm('draft')}
                disabled={isSavingDraft || isPublishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                ذخیره پیش‌نویس
              </button>

              <button
                type="button"
                onClick={() => submitForm('publish')}
                disabled={isSavingDraft || isPublishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.78)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                ثبت نهایی آگهی
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}