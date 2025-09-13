import React, { useState, useEffect } from 'react';
import { EditAction, RealismLevel, ImageModel, TabState } from './types';
import { editImageWithGemini } from './services/geminiService';
import { ImageEditor } from './components/ImageEditor';
import { EditControls } from './components/EditControls';
import { useLanguage } from './language';

// A sample public domain fabric texture to help new users get started.
const SAMPLE_IMAGE_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAFAAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1VXV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAFix the following errors:
- Error in file src/main.tsx on line 3: Module '"file:///src/App"' has no default export.
let tabCounter = 0;

export type SelectionTool = 'brush' | 'magic-wand' | 'box';
export type CropRect = { x: number; y: number; width: number; height: number; };

const createNewTab = (image: string, name?: string): TabState => {
  tabCounter++;
  return {
    id: `tab-${Date.now()}-${tabCounter}`,
    name: name || `Image ${tabCounter}`,
    history: [image],
    historyIndex: 0,
    mask: null,
  };
};

const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const { t, setLanguage, language } = useLanguage();
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [realismLevel, setRealismLevel] = useState<RealismLevel>('mid');
  const model: ImageModel = 'gemini-2.5-flash-image-preview';

  const [brushSize, setBrushSize] = useState<number>(30);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<SelectionTool>('brush');
  const [magicWandTolerance, setMagicWandTolerance] = useState<number>(20);

  // API Usage Tracking State
  const [apiRequestLimit, setApiRequestLimit] = useState<number>(1000);
  const [apiRequestsMade, setApiRequestsMade] = useState<number>(0);
  
  // Crop Tool State
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);

  // Load API usage from localStorage on initial render
  useEffect(() => {
    try {
      const savedLimit = localStorage.getItem('apiRequestLimit');
      const savedMade = localStorage.getItem('apiRequestsMade');
      if (savedLimit) setApiRequestLimit(JSON.parse(savedLimit));
      if (savedMade) setApiRequestsMade(JSON.parse(savedMade));
    } catch (e) {
      console.error("Failed to parse API usage from localStorage", e);
    }
  }, []);

  // Save API usage to localStorage whenever it changes
  useEffect(() => {
    try {
        localStorage.setItem('apiRequestLimit', JSON.stringify(apiRequestLimit));
    } catch (e) {
        console.error("Failed to save API request limit to localStorage", e);
    }
  }, [apiRequestLimit]);

  useEffect(() => {
    try {
        localStorage.setItem('apiRequestsMade', JSON.stringify(apiRequestsMade));
    } catch (e) {
        console.error("Failed to save API requests made to localStorage", e);
    }
  }, [apiRequestsMade]);

  const handleResetApiRequestsMade = () => {
    setApiRequestsMade(0);
  };

  const activeTab = activeTabIndex >= 0 ? tabs[activeTabIndex] : null;
  const texture = activeTab?.history[activeTab.historyIndex] ?? null;
  const canUndo = activeTab ? activeTab.historyIndex > 0 : false;
  const canRedo = activeTab ? activeTab.historyIndex < activeTab.history.length - 1 : false;

  const updateActiveTab = (updates: Partial<TabState>) => {
    if (activeTabIndex === -1) return;
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      newTabs[activeTabIndex] = { ...newTabs[activeTabIndex], ...updates };
      return newTabs;
    });
  };
  
  const clearErrors = () => {
    if (error) setError(null);
  }

  const addHistoryState = (newTexture: string) => {
    if (!activeTab) return;
    const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
    newHistory.push(newTexture);
    updateActiveTab({ history: newHistory, historyIndex: newHistory.length - 1 });
  };
  
  const handleTextureUpload = (image: string) => {
    clearErrors();
    const newTab = createNewTab(image);
    setTabs([...tabs, newTab]);
    setActiveTabIndex(tabs.length);
    setPreviewImage(null);
    setIsComparing(false);
  };
  
  const handleLoadSample = () => {
    handleTextureUpload(SAMPLE_IMAGE_BASE64);
  }
  
  const handleAddNewTab = () => {
      // This is a placeholder for a file picker, but for now we re-use the sample
      handleLoadSample();
  }
  
  const handleCloseTab = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      const newTabs = tabs.filter((_, i) => i !== index);
      setTabs(newTabs);
      if (activeTabIndex >= index) {
          setActiveTabIndex(Math.max(0, activeTabIndex - 1));
      }
      if (newTabs.length === 0) {
          setActiveTabIndex(-1);
      }
  }

  const handleEdit = async (action: EditAction, options?: { modifyPrompt?: string; recolorValue?: string; stylizeValue?: string }) => {
    if (!texture || !activeTab) return;
    if (action !== 'enhance' && action !== 'remove-bg' && !activeTab.mask) return;

    clearErrors();
    setIsLoading(true);
    setApiRequestsMade(prev => prev + 1); // Increment API counter
    
    let message = t('loadingEdit');
    if (action === 'enhance') message = t('loadingEnhanceAll');
    if (action === 'fill') message = t('loadingFill');
    if (action === 'remove-bg') message = t('loadingRemoveBg');
    setLoadingMessage(message);

    try {
      const editedImage = await editImageWithGemini(
        texture, 
        activeTab.mask, 
        action, 
        options?.modifyPrompt, 
        realismLevel,
        options?.recolorValue,
        options?.stylizeValue
      );
      setPreviewImage(editedImage);
      if (action === 'enhance' || action === 'remove-bg') {
        setIsComparing(true); 
      } else {
        setIsComparing(false);
      }
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleApplyPreview = () => {
    if (!previewImage) return;
    addHistoryState(previewImage);
    setPreviewImage(null);
    updateActiveTab({ mask: null });
    setIsComparing(false);
  };

  const handleCancelPreview = () => {
    setPreviewImage(null);
    setIsComparing(false);
  };
  
  const handleClearSelection = () => {
    updateActiveTab({ mask: null });
  };
  
  const handleUndo = () => {
    if (canUndo && activeTab) {
      updateActiveTab({ 
        historyIndex: activeTab.historyIndex - 1, 
        mask: null,
      });
      setPreviewImage(null);
      setIsComparing(false);
    }
  };

  const handleRedo = () => {
    if (canRedo && activeTab) {
      updateActiveTab({ 
        historyIndex: activeTab.historyIndex + 1,
        mask: null,
       });
      setPreviewImage(null);
      setIsComparing(false);
    }
  };

  const handleSave = () => {
    if (!texture) return;
    const link = document.createElement('a');
    link.download = `edited-texture-${Date.now()}.png`;
    link.href = texture;
    link.click();
  };

  const handleFileDrop = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      clearErrors();
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          handleTextureUpload(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please drop a valid image file (PNG, JPG, WebP).");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading || previewImage) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const handleToggleCropping = (enabled: boolean) => {
      setIsCropping(enabled);
      if (!enabled) {
          setCropRect(null); // Reset rect on cancel
      }
  };

  const handleConfirmCrop = () => {
      if (!texture || !cropRect) return;

      const image = new Image();
      image.onload = () => {
          const canvas = document.createElement('canvas');
          const x = Math.max(0, Math.floor(cropRect.x));
          const y = Math.max(0, Math.floor(cropRect.y));
          const width = Math.max(1, Math.floor(cropRect.width));
          const height = Math.max(1, Math.floor(cropRect.height));
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

          const originalMimeType = texture.substring(texture.indexOf(":") + 1, texture.indexOf(";"));
          const croppedImageBase64 = canvas.toDataURL(originalMimeType);
          
          addHistoryState(croppedImageBase64);
          updateActiveTab({ mask: null }); // Clear mask as it's now invalid
          handleToggleCropping(false); // Exit cropping mode
      };
      image.src = texture;
  };

  const isEditingDisabled = isLoading || !!previewImage;
  const isInteractionDisabled = isEditingDisabled || isCropping;
  const isQuotaError = error && error.includes('RESOURCE_EXHAUSTED');

  return (
    <div className="h-screen font-sans text-slate-200 flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="w-full text-center p-4 border-b border-white/10">
        <div className="flex justify-center items-center gap-4">
             <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                {t('headerTitle')}
             </h1>
             <div className="flex bg-black/20 rounded-full p-1 border border-white/10">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs rounded-full transition-colors ${language === 'en' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>EN</button>
                <button onClick={() => setLanguage('ar')} className={`px-3 py-1 text-xs rounded-full transition-colors ${language === 'ar' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>AR</button>
             </div>
        </div>
      </header>
      
      <div className="flex-grow w-full max-w-screen-2xl mx-auto flex flex-col overflow-hidden">
        {error && (
          <div className="w-full max-w-4xl mx-auto glass-panel border-red-500/50 text-red-200 px-4 py-3 rounded-lg relative my-4 text-left animate-fade-in shrink-0" role="alert">
            <div className="flex">
               <div className="py-1"><svg className="fill-current h-6 w-6 text-red-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg></div>
              <div>
                <p className="font-bold">{isQuotaError ? t('quotaErrorTitle') : t('errorPrefix')}</p>
                <p className="text-sm">{isQuotaError ? t('quotaErrorMessage') : error.replace('Failed to edit image: ', '')}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
              <svg className="fill-current h-6 w-6 text-red-300" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>{t('closeTitle')}</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}
        
        <div className="w-full flex items-center pt-2 px-2 gap-2 shrink-0">
           {tabs.map((tab, index) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTabIndex(index)}
                    className={`flex items-center gap-2 p-2 rounded-t-lg transition-colors ${activeTabIndex === index ? 'bg-gray-800/60' : 'bg-gray-900/50 hover:bg-gray-900/80'}`}
                >
                    <img src={tab.history[0]} alt={tab.name} className="w-6 h-6 rounded object-cover" />
                    <span className="text-xs text-slate-300">{tab.name}</span>
                    <button 
                      onClick={(e) => handleCloseTab(e, index)} 
                      className="w-5 h-5 rounded-full hover:bg-red-500/50 flex items-center justify-center text-slate-400 hover:text-white"
                      title={t('closeTabTooltip')}
                     >
                      &times;
                    </button>
                </button>
            ))}
            <button 
              onClick={handleAddNewTab}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-purple-500/50 flex items-center justify-center text-2xl text-slate-400 hover:text-white transition-colors"
              title={t('addTabButton')}
            >
                +
            </button>
        </div>

        <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full p-4 overflow-hidden">
          <aside className="lg:col-span-1 xl:col-span-1 glass-panel flex flex-col overflow-hidden">
            <EditControls
              hasSelection={!!activeTab?.mask}
              onEdit={handleEdit}
              onSave={handleSave}
              isLoading={isLoading}
              isImageLoaded={!!texture}
              isEditingDisabled={isEditingDisabled}
              onTextureUpload={handleTextureUpload}
              onClearSelection={handleClearSelection}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onEnhanceAll={() => handleEdit('enhance')}
              onRemoveBackground={() => handleEdit('remove-bg')}
              isComparing={isComparing}
              onSetIsComparing={setIsComparing}
              isPreviewActive={!!previewImage}
              realismLevel={realismLevel}
              onSetRealismLevel={setRealismLevel}
              model={model}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              isErasing={isErasing}
              onIsErasingChange={setIsErasing}
              activeTool={activeTool}
              onActiveToolChange={setActiveTool}
              magicWandTolerance={magicWandTolerance}
              onMagicWandToleranceChange={setMagicWandTolerance}
              apiRequestLimit={apiRequestLimit}
              onApiRequestLimitChange={setApiRequestLimit}
              apiRequestsMade={apiRequestsMade}
              onApiRequestsMadeChange={setApiRequestsMade}
              onResetApiRequestsMade={handleResetApiRequestsMade}
              isCropping={isCropping}
              onToggleCropping={handleToggleCropping}
              onConfirmCrop={handleConfirmCrop}
              isCropAreaSelected={!!cropRect}
            />
          </aside>

          <section 
            className={`lg:col-span-2 xl:col-span-3 glass-panel flex items-center justify-center p-2 relative min-h-[400px] lg:min-h-0 transition-all duration-300 ${isDragging ? 'border-purple-500 border-dashed shadow-2xl shadow-purple-500/20' : 'border-transparent'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!texture ? (
              <div className="text-center text-slate-500">
                  <div className="pointer-events-none">
                      <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 1 1-.45 0 .225.225 0 0 1 .45 0Z" /></svg>
                      <p className="mt-4 text-lg font-semibold">{t('uploadPrompt')}</p>
                      <p className="text-slate-400 mt-1 text-sm">{t('dragDropPrompt')}</p>
                  </div>
                   <div className="mt-6">
                      <button onClick={handleLoadSample} className="btn btn-secondary text-sm !w-auto">
                          {t('trySampleButton')}
                      </button>
                  </div>
              </div>
            ) : (
              <ImageEditor
                key={activeTab?.id}
                imageSrc={previewImage || texture}
                beforeSrc={texture}
                isComparing={isComparing && !!previewImage}
                mask={activeTab?.mask || null}
                onMaskChange={(mask) => updateActiveTab({ mask })}
                isInteractionDisabled={isInteractionDisabled}
                brushSize={brushSize}
                isErasing={isErasing}
                activeTool={activeTool}
                tolerance={magicWandTolerance}
                isCropping={isCropping}
                onCropRectChange={setCropRect}
              />
            )}

            {isDragging && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl z-10 pointer-events-none animate-fade-in">
                  <p className="text-xl font-bold text-purple-400">{t('dropPrompt')}</p>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 glass-panel border-0 flex flex-col items-center justify-center rounded-xl z-20">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
                <p className="mt-4 text-base font-semibold text-slate-300">{loadingMessage}</p>
              </div>
            )}

            {previewImage && !isLoading && (
               <div className="glass-panel absolute bottom-6 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-2xl flex space-x-4 z-20 animate-fade-in">
                  <button onClick={handleApplyPreview} className="btn btn-save">
                    {t('applyButton')}
                  </button>
                  <button onClick={handleCancelPreview} className="btn btn-destructive">
                    {t('cancelButton')}
                  </button>
               </div>
            )}
          </section>
        </main>
      </div>
      <footer className="w-full text-center text-xs text-slate-600 p-2 border-t border-white/10 shrink-0">
        <p className="text-slate-500">
          {t('copyrightNotice').replace('{year}', new Date().getFullYear().toString())}
        </p>
      </footer>
    </div>
  );
};

// FIX: Add default export for App component
export default App;
