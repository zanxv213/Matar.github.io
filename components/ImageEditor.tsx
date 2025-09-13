import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SelectionTool, CropRect } from '../App';

interface ImageEditorProps {
  imageSrc: string;
  mask: string | null;
  onMaskChange: (mask: string | null) => void;
  brushSize: number;
  isErasing: boolean;
  isInteractionDisabled?: boolean;
  isComparing?: boolean;
  beforeSrc?: string;
  activeTool: SelectionTool;
  tolerance: number;
  isCropping?: boolean;
  onCropRectChange?: (rect: CropRect | null) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ 
  imageSrc, 
  mask,
  onMaskChange,
  brushSize,
  isErasing,
  isInteractionDisabled = false,
  isComparing = false,
  beforeSrc,
  activeTool,
  tolerance,
  isCropping = false,
  onCropRectChange = () => {}
}) => {
  const [isPainting, setIsPainting] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [preBoxDrawState, setPreBoxDrawState] = useState<ImageData | null>(null);
  
  // Cropping state
  const [isDrawingCrop, setIsDrawingCrop] = useState(false);
  const [cropStartPoint, setCropStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [localCropRect, setLocalCropRect] = useState<CropRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null); // For crop overlay
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0, ready: false });

  const getCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !transform.ready) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const viewY = e.clientY - rect.top;
    return {
      x: (viewX - transform.offsetX) / transform.scale,
      y: (viewY - transform.offsetY) / transform.scale,
    };
  };

  const magicWandSelect = (startX: number, startY: number) => {
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas) return;

    const imgCtx = imageCanvas.getContext('2d', { willReadFrequently: true });
    const maskCtx = maskCanvas.getContext('2d');
    if (!imgCtx || !maskCtx) return;

    const { width, height } = imageCanvas;
    const imageData = imgCtx.getImageData(0, 0, width, height);
    const maskData = maskCtx.createImageData(width, height);
    const { data } = imageData;

    const startPos = (Math.round(startY) * width + Math.round(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];

    const visited = new Uint8Array(width * height);
    const queue: [number, number][] = [[Math.round(startX), Math.round(startY)]];
    const toleranceSq = tolerance * tolerance * 3; // Compare squared distance

    visited[Math.round(startY) * width + Math.round(startX)] = 1;

    const R = 139, G = 92, B = 246; // Purple color for selection
    const A = 255; // 100% opacity for "hard" selection

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentPos = (y * width + x) * 4;
        const r = data[currentPos];
        const g = data[currentPos + 1];
        const b = data[currentPos + 2];

        const distSq = (r - startR) ** 2 + (g - startG) ** 2 + (b - startB) ** 2;

        if (distSq <= toleranceSq) {
            maskData.data[currentPos] = R;
            maskData.data[currentPos + 1] = G;
            maskData.data[currentPos + 2] = B;
            maskData.data[currentPos + 3] = A;

            const neighbors: [number, number][] = [
                [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
            ];
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const neighborIndex = ny * width + nx;
                    if (!visited[neighborIndex]) {
                        visited[neighborIndex] = 1;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }
    maskCtx.putImageData(maskData, 0, 0);
    onMaskChange(maskCanvas.toDataURL());
  };

  const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
    const ctx = maskCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgb(139, 92, 246)'; // Solid purple for 100% hardness
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isInteractionDisabled && !isCropping) return;
    const coords = getCoords(e);
    
    if (isCropping) {
      setIsDrawingCrop(true);
      setCropStartPoint(coords);
      setLocalCropRect(null);
      onCropRectChange(null);
      return;
    }
    
    if (activeTool === 'brush') {
      setIsPainting(true);
      lastPointRef.current = coords;
    } else if (activeTool === 'magic-wand') {
      magicWandSelect(coords.x, coords.y);
    } else if (activeTool === 'box') {
      setIsPainting(true);
      lastPointRef.current = coords; // Use as start point
      const ctx = maskCanvasRef.current?.getContext('2d');
      if (ctx) {
        setPreBoxDrawState(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if(rect) {
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    
    const coords = getCoords(e);
    lastCoordsRef.current = coords;

    if (isDrawingCrop && cropStartPoint) {
        const x = Math.min(cropStartPoint.x, coords.x);
        const y = Math.min(cropStartPoint.y, coords.y);
        const width = Math.abs(cropStartPoint.x - coords.x);
        const height = Math.abs(cropStartPoint.y - coords.y);
        setLocalCropRect({ x, y, width, height });
        return;
    }

    if (!isPainting || (isInteractionDisabled && !isCropping)) return;

    if (activeTool === 'brush') {
      if (lastPointRef.current) {
        drawLine(lastPointRef.current.x, lastPointRef.current.y, coords.x, coords.y);
      }
      lastPointRef.current = coords;
    } else if (activeTool === 'box') {
        const ctx = maskCanvasRef.current?.getContext('2d');
        const startPoint = lastPointRef.current;
        if (!ctx || !startPoint || !preBoxDrawState) return;
        ctx.putImageData(preBoxDrawState, 0, 0);
        const x = Math.min(startPoint.x, coords.x);
        const y = Math.min(startPoint.y, coords.y);
        const width = Math.abs(startPoint.x - coords.x);
        const height = Math.abs(startPoint.y - coords.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5 / transform.scale;
        ctx.setLineDash([6 / transform.scale, 4 / transform.scale]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
    }
  };
  
  const handleMouseUp = () => {
    if (isDrawingCrop) {
      setIsDrawingCrop(false);
      setCropStartPoint(null);
      if (localCropRect && localCropRect.width > 0 && localCropRect.height > 0) {
        onCropRectChange(localCropRect);
      }
      return;
    }

    if (!isPainting) return;

    const ctx = maskCanvasRef.current?.getContext('2d');

    if (activeTool === 'box') {
      const startPoint = lastPointRef.current;
      const endPoint = lastCoordsRef.current;
      if (ctx && startPoint && endPoint && preBoxDrawState) {
        ctx.putImageData(preBoxDrawState, 0, 0);
        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(startPoint.x - endPoint.x);
        const height = Math.abs(startPoint.y - endPoint.y);
        if (width > 0 && height > 0) {
          ctx.fillStyle = 'rgb(139, 92, 246)';
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillRect(x, y, width, height);
        }
      }
    }
    
    setIsPainting(false);
    lastPointRef.current = null;
    lastCoordsRef.current = null;
    if (activeTool === 'box') setPreBoxDrawState(null);
    
    const dataUrl = maskCanvasRef.current?.toDataURL();
    onMaskChange(dataUrl || null);
  };
  
  const handleMouseLeave = () => {
    if (isDrawingCrop) handleMouseUp();
    if(isPainting) handleMouseUp();
    setCursorPos({ x: -100, y: -100 });
  };

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const imageCanvas = imageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const cropCanvas = cropCanvasRef.current;
      const container = containerRef.current;
      if (!imageCanvas || !maskCanvas || !container || !cropCanvas) return;
      
      imageCanvas.width = image.naturalWidth;
      imageCanvas.height = image.naturalHeight;
      maskCanvas.width = image.naturalWidth;
      maskCanvas.height = image.naturalHeight;
      cropCanvas.width = image.naturalWidth;
      cropCanvas.height = image.naturalHeight;

      const updateTransform = () => {
        const { width: viewWidth, height: viewHeight } = container.getBoundingClientRect();
        const scaleX = viewWidth / imageCanvas.width;
        const scaleY = viewHeight / imageCanvas.height;
        const scale = Math.min(scaleX, scaleY);

        const offsetX = (viewWidth - imageCanvas.width * scale) / 2;
        const offsetY = (viewHeight - imageCanvas.height * scale) / 2;

        setTransform({ scale, offsetX, offsetY, ready: true });
      };
      
      const ctx = imageCanvas.getContext('2d');
      ctx?.drawImage(image, 0, 0);

      const observer = new ResizeObserver(updateTransform);
      observer.observe(container);
      updateTransform();

      return () => observer.disconnect();
    };
    image.src = imageSrc;
  }, [imageSrc, isComparing]);
  
  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mask) {
      const maskImage = new Image();
      maskImage.onload = () => {
        ctx.drawImage(maskImage, 0, 0);
      };
      maskImage.src = mask;
    }
  }, [mask]);
  
  useEffect(() => {
    if (!isCropping) {
      setLocalCropRect(null);
      onCropRectChange(null);
    }
  }, [isCropping]);
  
  useEffect(() => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isCropping) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (localCropRect) {
            ctx.clearRect(localCropRect.x, localCropRect.y, localCropRect.width, localCropRect.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.5 / transform.scale;
            ctx.strokeRect(localCropRect.x, localCropRect.y, localCropRect.width, localCropRect.height);
        }
    }
  }, [isCropping, localCropRect, transform]);


  if (isComparing && beforeSrc) {
    return (
        <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden touch-none">
          <img src={beforeSrc} alt="Before" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
          <div
            className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img src={imageSrc} alt="After" className="absolute top-0 left-0 w-full h-full object-contain" />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/70 cursor-ew-resize pointer-events-none"
            style={{ left: `calc(${sliderPosition}% - 2px)` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-white/70 rounded-full flex items-center justify-center shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            aria-label="Comparison slider"
          />
        </div>
    )
  }

  const canvasStyle: React.CSSProperties = transform.ready ? {
    position: 'absolute',
    transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
    transformOrigin: 'top left',
  } : { display: 'none' };
  
  const getCursor = () => {
    if (isInteractionDisabled && !isCropping) return 'default';
    if (isCropping) return 'crosshair';
    switch(activeTool) {
      case 'brush': return 'none';
      case 'magic-wand': return 'crosshair';
      case 'box': return 'crosshair';
      default: return 'default';
    }
  }
  
  const brushCursorStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${cursorPos.x}px`,
      top: `${cursorPos.y}px`,
      width: `${brushSize * transform.scale}px`,
      height: `${brushSize * transform.scale}px`,
      border: `2px solid ${isErasing ? '#F472B6' : '#67E8F9'}`,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 10,
      mixBlendMode: 'difference'
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full select-none overflow-hidden touch-none"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
    >
      <canvas ref={imageCanvasRef} style={canvasStyle} className="pointer-events-none" />
      <canvas ref={maskCanvasRef} style={canvasStyle} className="pointer-events-none opacity-100" />
      <canvas ref={cropCanvasRef} style={canvasStyle} className="pointer-events-none" />
      {!isInteractionDisabled && activeTool === 'brush' && <div style={brushCursorStyle} />}
    </div>
  );
};