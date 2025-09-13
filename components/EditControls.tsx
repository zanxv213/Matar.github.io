import React, { useState } from 'react';
import { EditAction, RealismLevel, ImageModel } from '../types';
import { ImageUploader } from './ImageUploader';
import { useLanguage } from '../language';
import { SelectionTool } from '../App';

interface EditControlsProps {
  hasSelection: boolean;
  onEdit: (action: EditAction, options?: { modifyPrompt?: string; recolorValue?: string; stylizeValue?: string }) => void;
  onSave: () => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  isEditingDisabled: boolean;
  onTextureUpload: (image: string) => void;
  onClearSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onEnhanceAll: () => void;
  onRemoveBackground: () => void;
  isComparing: boolean;
  onSetIsComparing: (isComparing: boolean) => void;
  isPreviewActive: boolean;
  realismLevel: RealismLevel;
  onSetRealismLevel: (level: RealismLevel) => void;
  model: ImageModel;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isErasing: boolean;
  onIsErasingChange: (isErasing: boolean) => void;
  activeTool: SelectionTool;
  onActiveToolChange: (tool: SelectionTool) => void;
  magicWandTolerance: number;
  onMagicWandToleranceChange: (value: number) => void;
  apiRequestLimit: number;
  onApiRequestLimitChange: (value: number) => void;
  apiRequestsMade: number;
  onApiRequestsMadeChange: (value: number) => void;
  onResetApiRequestsMade: () => void;
  isCropping: boolean;
  onToggleCropping: (enabled: boolean) => void;
  onConfirmCrop: () => void;
  isCropAreaSelected: boolean;
}

type EditTab = 'simple' | 'modify' | 'recolor' | 'stylize';

const ControlSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
);

export const EditControls: React.FC<EditControlsProps> = ({ 
  hasSelection, onEdit, onSave, isLoading, isImageLoaded, isEditingDisabled, onTextureUpload, onClearSelection,
  onUndo, onRedo, canUndo, canRedo, onEnhanceAll, onRemoveBackground, isComparing, onSetIsComparing, isPreviewActive,
  realismLevel, onSetRealismLevel, model, brushSize, onBrushSizeChange, isErasing, onIsErasingChange,
  activeTool, onActiveToolChange, magicWandTolerance, onMagicWandToleranceChange,
  apiRequestLimit, onApiRequestLimitChange, apiRequestsMade, onApiRequestsMadeChange, onResetApiRequestsMade,
  isCropping, onToggleCropping, onConfirmCrop, isCropAreaSelected
}) => {
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [stylizePrompt, setStylizePrompt] = useState('');
  const [recolorValue, setRecolorValue] = useState('#ffffff');
  const [activeEditTab, setActiveEditTab] = useState<EditTab>('simple');
  const { t } = useLanguage();

  const handleModify = () => {
    if (modifyPrompt.trim()) {
      onEdit('modify', { modifyPrompt });
    }
  };
  
  const handleStylize = () => {
    if (stylizePrompt.trim()) {
      onEdit('stylize', { stylizeValue: stylizePrompt });
    }
  };
  
  const handleRecolor = () => {
    onEdit('recolor', { recolorValue });
  };
  
  const isDisabled = isLoading || isEditingDisabled || isCropping;

  const usagePercentage = apiRequestLimit > 0 ? Math.min((apiRequestsMade / apiRequestLimit) * 100, 100) : 0;
  const getUsageBarColor = () => {
    if (usagePercentage > 85) return 'from-red-500 to-orange-500';
    if (usagePercentage > 60) return 'from-yellow-500 to-amber-500';
    return 'from-green-500 to-emerald-500';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10 shrink-0">
        <ControlSection title={t('uploadTitle')}>
            <ImageUploader id="texture-upload" label={t('uploadTextureButton')} onImageUpload={onTextureUpload} disabled={isLoading || isEditingDisabled} className="btn btn-primary text-base"/>
        </ControlSection>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {isImageLoaded && (
          <>
            <ControlSection title={t('historyTitle')}>
              <div className="flex space-x-4">
                <button onClick={onUndo} disabled={!canUndo || isDisabled} className="btn btn-secondary">
                  {t('undoButton')}
                </button>
                <button onClick={onRedo} disabled={!canRedo || isDisabled} className="btn btn-secondary">
                  {t('redoButton')}
                </button>
              </div>
            </ControlSection>

            <ControlSection title={t('modelTitle')}>
               <div className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-sm text-slate-300 text-center">
                  {t(model)}
               </div>
            </ControlSection>
            
            <ControlSection title={t('apiUsageTitle')}>
              <div className='space-y-3 p-3 bg-black/20 rounded-lg border border-white/10'>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="api-limit" className="text-xs text-slate-400 block mb-1">{t('apiRequestLimitLabel')}</label>
                        <input 
                          id="api-limit" 
                          type="number"
                          value={apiRequestLimit}
                          onChange={e => onApiRequestLimitChange(Number(e.target.value))}
                          disabled={isLoading || isEditingDisabled}
                          className="w-full p-1.5 bg-slate-900/80 border border-white/10 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="api-made" className="text-xs text-slate-400 block mb-1">{t('apiRequestsMadeLabel')}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            id="api-made" 
                            type="number"
                            value={apiRequestsMade}
                            onChange={e => onApiRequestsMadeChange(Number(e.target.value))}
                            disabled={isLoading || isEditingDisabled}
                            className="flex-grow p-1.5 bg-slate-900/80 border border-white/10 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm"
                          />
                          <button 
                              onClick={onResetApiRequestsMade} 
                              disabled={isLoading || isEditingDisabled} 
                              className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                              title={t('resetRequestsButton')}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m0-11.667a8.25 8.25 0 00-11.667 0L2.985 7.985" />
                              </svg>
                          </button>
                        </div>
                    </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div 
                      className={`bg-gradient-to-r ${getUsageBarColor()} h-2.5 rounded-full transition-all duration-500`} 
                      style={{width: `${usagePercentage}%`}}
                    ></div>
                </div>
                <p className="text-xs text-slate-500 text-center pt-1">
                  {t('apiUsageDescription')} {' '}
                  <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors underline"
                  >
                      {t('apiKeyUsageLink')}
                  </a>
                </p>
              </div>
            </ControlSection>

            <ControlSection title={t('realismTitle')}>
              <div className="flex bg-black/20 rounded-full p-1 border border-white/10">
                  {(['low', 'mid', 'high'] as RealismLevel[]).map((level) => (
                      <button
                          key={level}
                          onClick={() => onSetRealismLevel(level)}
                          disabled={isDisabled}
                          className={`flex-1 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                              realismLevel === level
                                  ? 'bg-purple-600 text-white'
                                  : 'text-slate-400 hover:bg-white/5'
                          }`}
                      >
                          {t(`realism${level.charAt(0).toUpperCase() + level.slice(1)}`)}
                      </button>
                  ))}
              </div>
            </ControlSection>
            
             <ControlSection title={t('selectionToolsTitle')}>
                <div className="flex bg-black/20 rounded-full p-1 border border-white/10">
                    <button onClick={() => onActiveToolChange('brush')} disabled={isDisabled} className={`flex-1 py-1 text-xs font-semibold rounded-full transition-colors ${activeTool === 'brush' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{t('brushTool')}</button>
                    <button onClick={() => onActiveToolChange('magic-wand')} disabled={isDisabled} className={`flex-1 py-1 text-xs font-semibold rounded-full transition-colors ${activeTool === 'magic-wand' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{t('magicWandTool')}</button>
                    <button onClick={() => onActiveToolChange('box')} disabled={isDisabled} className={`flex-1 py-1 text-xs font-semibold rounded-full transition-colors ${activeTool === 'box' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{t('boxTool')}</button>
                </div>

                {activeTool === 'brush' && !isCropping && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex bg-black/20 rounded-full p-1 border border-white/10">
                        <button onClick={() => onIsErasingChange(false)} disabled={isDisabled} className={`flex-1 py-1 text-xs font-semibold rounded-full transition-colors ${!isErasing ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{t('brushTool')}</button>
                        <button onClick={() => onIsErasingChange(true)} disabled={isDisabled} className={`flex-1 py-1 text-xs font-semibold rounded-full transition-colors ${isErasing ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{t('eraserTool')}</button>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="brush-size" className="text-xs text-slate-400">{t('brushSizeLabel')}: {brushSize}px</label>
                        <input id="brush-size" type="range" min="2" max="100" value={brushSize} disabled={isDisabled} onChange={(e) => onBrushSizeChange(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                )}
                {activeTool === 'magic-wand' && !isCropping && (
                    <div className="space-y-2 animate-fade-in">
                        <label htmlFor="magic-wand-tolerance" className="text-xs text-slate-400">{t('toleranceLabel')}: {magicWandTolerance}</label>
                        <input id="magic-wand-tolerance" type="range" min="1" max="100" value={magicWandTolerance} disabled={isDisabled} onChange={(e) => onMagicWandToleranceChange(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                )}
            </ControlSection>

            <ControlSection title={t('quickActionsTitle')}>
              <div className="space-y-4">
                 <button onClick={onEnhanceAll} disabled={isDisabled} className="btn btn-secondary">
                    {t('enhanceAllButton')}
                 </button>
                 <button onClick={onRemoveBackground} disabled={isDisabled} className="btn btn-secondary">
                    {t('removeBackgroundButton')}
                </button>
                <button onClick={() => onToggleCropping(true)} disabled={isDisabled} className="btn btn-secondary">
                    {t('cropImageButton')}
                </button>
              </div>
            </ControlSection>
            
            {isCropping && (
              <div className="animate-fade-in">
                <ControlSection title={t('croppingTitle')}>
                  <p className="text-xs text-slate-400 text-center">{t('croppingHint')}</p>
                  <div className="flex space-x-4 pt-2">
                    <button onClick={onConfirmCrop} disabled={!isCropAreaSelected || isLoading} className="btn btn-primary">
                      {t('confirmCropButton')}
                    </button>
                    <button onClick={() => onToggleCropping(false)} disabled={isLoading} className="btn btn-secondary">
                      {t('cancelCropButton')}
                    </button>
                  </div>
                </ControlSection>
              </div>
            )}
            

            {hasSelection && !isCropping ? (
              <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('editSelectionTitle')}</h3>
                      <button onClick={onClearSelection} disabled={isDisabled} className="text-xs text-slate-400 hover:text-white disabled:opacity-50">
                          {t('clearSelectionButton')}
                      </button>
                  </div>
                  
                  <div className="flex bg-black/20 rounded-full p-1 border border-white/10 text-xs">
                    {(['simple', 'modify', 'recolor', 'stylize'] as EditTab[]).map(tab => (
                       <button key={tab} onClick={() => setActiveEditTab(tab)} disabled={isDisabled} className={`flex-1 py-1 font-semibold rounded-full transition-colors ${activeEditTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                         {t(`${tab}Tab`)}
                       </button>
                    ))}
                  </div>

                  <div className="pt-2">
                      {activeEditTab === 'simple' && (
                         <div className="grid grid-cols-2 gap-4 animate-fade-in">
                            <button onClick={() => onEdit('remove')} disabled={isDisabled} className="btn btn-secondary">{t('removeButton')}</button>
                            <button onClick={() => onEdit('fix')} disabled={isDisabled} className="btn btn-secondary">{t('fixButton')}</button>
                            <button onClick={() => onEdit('fill')} disabled={isDisabled} className="btn btn-secondary col-span-2">{t('fillButton')}</button>
                         </div>
                      )}
                      {activeEditTab === 'modify' && (
                          <div className="space-y-3 animate-fade-in">
                              <textarea value={modifyPrompt} onChange={(e) => setModifyPrompt(e.target.value)} placeholder={t('modifyPlaceholder')} disabled={isDisabled} className="w-full p-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm" rows={3} />
                              <button onClick={handleModify} disabled={isDisabled || !modifyPrompt.trim()} className="btn btn-primary">
                              {t('modifyButton')}
                              </button>
                          </div>
                      )}
                      {activeEditTab === 'recolor' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-4">
                              <label htmlFor="recolor-picker" className="text-sm text-slate-300">{t('recolorAction')}:</label>
                              <input id="recolor-picker" type="color" value={recolorValue} onChange={e => setRecolorValue(e.target.value)} disabled={isDisabled} className="w-12 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                            </div>
                            <button onClick={handleRecolor} disabled={isDisabled} className="btn btn-primary">{t('applyRecolorButton')}</button>
                        </div>
                      )}
                      {activeEditTab === 'stylize' && (
                          <div className="space-y-3 animate-fade-in">
                              <textarea value={stylizePrompt} onChange={(e) => setStylizePrompt(e.target.value)} placeholder={t('stylizePlaceholder')} disabled={isDisabled} className="w-full p-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm" rows={3} />
                              <button onClick={handleStylize} disabled={isDisabled || !stylizePrompt.trim()} className="btn btn-primary">{t('applyStyleButton')}</button>
                          </div>
                      )}
                  </div>
              </div>
            ) : (
              !isCropping && (
                  <div className="text-center text-sm text-slate-500 py-6 border-2 border-dashed border-white/10 rounded-lg">
                      <p>{t('noSelectionHint')}</p>
                  </div>
              )
            )}
           
            {isPreviewActive && (
                <div className="glass-panel w-full space-y-3 p-4 fixed bottom-8 right-8 max-w-xs z-30 shadow-2xl animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label htmlFor="compare-toggle" className="font-semibold text-purple-300 text-sm">{t('compareToggleLabel')}</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                          type="checkbox" 
                          name="compare-toggle" 
                          id="compare-toggle"
                          checked={isComparing}
                          onChange={(e) => onSetIsComparing(e.target.checked)}
                          disabled={isLoading}
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-400"
                        />
                        <label htmlFor="compare-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer"></label>
                    </div>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      <div className="p-6 border-t border-white/10 shrink-0">
          <ControlSection title={t('saveTitle')}>
            <button onClick={onSave} disabled={!isImageLoaded || isDisabled} className="btn btn-save">
                {t('saveButton')}
            </button>
          </ControlSection>
      </div>
    </div>
  );
};