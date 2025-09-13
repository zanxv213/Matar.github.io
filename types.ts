export interface TabState {
  id: string;
  name: string;
  history: string[];
  historyIndex: number;
  mask: string | null;
}

export type EditAction = 'remove' | 'fix' | 'modify' | 'enhance' | 'fill' | 'remove-bg' | 'recolor' | 'stylize';

export type RealismLevel = 'low' | 'mid' | 'high';

export type ImageModel = 'gemini-2.5-flash-image-preview';
