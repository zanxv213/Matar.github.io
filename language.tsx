import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    headerTitle: 'AI image Editor',
    headerSubtitle: 'Advanced AI-powered image and texture editing tools.',
    // App General
    errorPrefix: 'Error',
    quotaErrorTitle: 'API Quota Exceeded',
    quotaErrorMessage: 'The application has made too many requests and has reached its usage limit. For the app owner, this is tied to your API key plan. For public users, this is a shared limit that will reset automatically (usually within 24 hours).',
    closeTitle: 'Close',
    uploadPrompt: 'Upload an Image to Begin',
    dragDropPrompt: 'or drag & drop a file here',
    trySampleButton: 'Try with a Sample Image',
    dropPrompt: 'Drop Image to Upload',
    loadingEdit: 'AI is editing your image...',
    loadingEnhanceAll: 'AI is enhancing the image...',
    loadingFill: 'AI is filling selection...',
    loadingRemoveBg: 'AI is removing background...',
    applyButton: 'Apply',
    cancelButton: 'Cancel',
    // Tabs
    addTabButton: 'Add new image',
    closeTabTooltip: 'Close this tab',
    defaultTabName: 'Image',
    // EditControls
    uploadTitle: 'Upload',
    uploadTextureButton: 'Upload Image',
    historyTitle: 'History',
    undoButton: 'Undo',
    redoButton: 'Redo',
    modelTitle: 'AI Model',
    'gemini-2.5-flash-image-preview': 'Gemini 2.5 Flash (Image)',
    apiUsageTitle: 'API Usage',
    apiRequestLimitLabel: 'Request Limit',
    apiRequestsMadeLabel: 'Requests Made',
    resetRequestsButton: 'Reset Counter',
    apiUsageDescription: 'Set your limit from your Google dashboard. Requests are tracked automatically.',
    apiKeyUsageLink: 'Check official usage',
    realismTitle: 'AI Realism Level',
    realismLow: 'Low',
    realismMid: 'Mid',
    realismHigh: 'High',
    selectionToolsTitle: 'Selection Tools',
    brushTool: 'Brush',
    eraserTool: 'Eraser',
    magicWandTool: 'Magic Wand',
    boxTool: 'Box',
    brushSizeLabel: 'Brush Size',
    toleranceLabel: 'Tolerance',
    quickActionsTitle: 'Quick Actions',
    enhanceAllButton: 'Enhance Image',
    removeBackgroundButton: 'Remove Background',
    cropImageButton: 'Crop Image',
    croppingTitle: 'Cropping Tools',
    croppingHint: 'Click and drag on the image to select an area.',
    confirmCropButton: 'Confirm Crop',
    cancelCropButton: 'Cancel',
    editSelectionTitle: 'Edit Selection',
    clearSelectionButton: 'Clear Selection',
    noSelectionHint: 'Use a selection tool to select an area.',
    // Edit Selection Tabs
    simpleTab: 'Simple',
    modifyTab: 'Modify',
    recolorTab: 'Recolor',
    stylizeTab: 'Stylize',
    removeButton: 'Remove',
    fixButton: 'Fix',
    fillButton: 'Fill Selection',
    modifyPlaceholder: 'e.g., "add a zipper"',
    modifyButton: 'Modify',
    recolorAction: 'Recolor',
    applyRecolorButton: 'Apply Color',
    stylizePlaceholder: 'e.g., "cyberpunk neon effect"',
    applyStyleButton: 'Apply Style',
    saveTitle: 'Export',
    saveButton: 'Save Image',
    compareToggleLabel: 'Compare Changes',
    copyrightNotice: '© {year} I.Matar (nq.4x). All Rights Reserved.',
  },
  ar: {
    // Header
    headerTitle: 'محرر الخامات بالذكاء الاصطناعي',
    headerSubtitle: 'أدوات متقدمة لتحرير الصور والخامات باستخدام الذكاء الاصطناعي.',
    // App General
    errorPrefix: 'خطأ',
    quotaErrorTitle: 'تم تجاوز حصة الواجهة البرمجية',
    quotaErrorMessage: 'أجرى التطبيق عددًا كبيرًا جدًا من الطلبات ووصل إلى حد الاستخدام. لمالك التطبيق، يرتبط هذا بخطة مفتاح الواجهة البرمجية الخاصة بك. للمستخدمين العامين، هذا حد مشترك سيتم إعادة تعيينه تلقائيًا (عادةً في غضون 24 ساعة).',
    closeTitle: 'إغلاق',
    uploadPrompt: 'قم بتحميل صورة للبدء',
    dragDropPrompt: 'أو قم بسحب وإفلات ملف هنا',
    trySampleButton: 'جرب باستخدام صورة عينة',
    dropPrompt: 'أفلت الصورة للتحميل',
    loadingEdit: 'الذكاء الاصطناعي يعدل صورتك...',
    loadingEnhanceAll: 'الذكاء الاصطناعي يحسن الصورة...',
    loadingFill: 'الذكاء الاصطناعي يملأ التحديد...',
    loadingRemoveBg: 'الذكاء الاصطناعي يزيل الخلفية...',
    applyButton: 'تطبيق',
    cancelButton: 'إلغاء',
    // Tabs
    addTabButton: 'إضافة صورة جديدة',
    closeTabTooltip: 'إغلاق هذا التبويب',
    defaultTabName: 'صورة',
    // EditControls
    uploadTitle: 'تحميل',
    uploadTextureButton: 'تحميل صورة',
    historyTitle: 'السجل',
    undoButton: 'تراجع',
    redoButton: 'إعادة',
    modelTitle: 'نموذج الذكاء الاصطناعي',
    'gemini-2.5-flash-image-preview': 'Gemini 2.5 Flash (صور)',
    apiUsageTitle: 'استخدام الواجهة البرمجية',
    apiRequestLimitLabel: 'حد الطلبات',
    apiRequestsMadeLabel: 'الطلبات المستخدمة',
    resetRequestsButton: 'إعادة تعيين العداد',
    apiUsageDescription: 'عين حدك من لوحة تحكم جوجل. يتم تتبع الطلبات تلقائيًا.',
    apiKeyUsageLink: 'تحقق من الاستخدام الرسمي',
    realismTitle: 'مستوى واقعية الذكاء الاصطناعي',
    realismLow: 'منخفض',
    realismMid: 'متوسط',
    realismHigh: 'عالي',
    selectionToolsTitle: 'أدوات التحديد',
    brushTool: 'فرشاة',
    eraserTool: 'ممحاة',
    magicWandTool: 'عصا سحرية',
    boxTool: 'مربع',
    brushSizeLabel: 'حجم الفرشاة',
    toleranceLabel: 'التسامح',
    quickActionsTitle: 'إجراءات سريعة',
    enhanceAllButton: 'تحسين الصورة',
    removeBackgroundButton: 'إزالة الخلفية',
    cropImageButton: 'قص الصورة',
    croppingTitle: 'أدوات القص',
    croppingHint: 'انقر واسحب على الصورة لتحديد منطقة.',
    confirmCropButton: 'تأكيد القص',
    cancelCropButton: 'إلغاء',
    editSelectionTitle: 'تعديل التحديد',
    clearSelectionButton: 'مسح التحديد',
    noSelectionHint: 'استخدم أداة تحديد لتحديد منطقة.',
    // Edit Selection Tabs
    simpleTab: 'بسيط',
    modifyTab: 'تعديل',
    recolorTab: 'إعادة تلوين',
    stylizeTab: 'تنميق',
    removeButton: 'إزالة',
    fixButton: 'إصلاح',
    fillButton: 'ملء التحديد',
    modifyPlaceholder: 'مثال: "أضف سحابًا"',
    modifyButton: 'تعديل',
    recolorAction: 'إعادة تلوين',
    applyRecolorButton: 'تطبيق اللون',
    stylizePlaceholder: 'مثال: "تأثير نيون سايبربانك"',
    applyStyleButton: 'تطبيق النمط',
    saveTitle: 'تصدير',
    saveButton: 'حفظ الصورة',
    compareToggleLabel: 'مقارنة التغييرات',
    copyrightNotice: '© {year} I.Matar (nq.4x). جميع الحقوق محفوظة.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
