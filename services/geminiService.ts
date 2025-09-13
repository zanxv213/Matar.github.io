import { EditAction, RealismLevel } from '../types';

// The Gemini SDK is no longer used directly in the browser.
// All API calls are now proxied through our secure backend endpoint.

const drawInstructionsOnImage = (
    base64Image: string,
    base64Mask: string,
  ): Promise<{ image: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const originalMimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
        const img = new Image();
        const maskImg = new Image();

        let imgLoaded = false;
        let maskLoaded = false;

        const onBothLoaded = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, 0, 0);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return reject(new Error('Could not get temp canvas context'));

            tempCtx.fillStyle = 'rgba(76, 175, 80, 1)'; 
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(maskImg, 0, 0);

            ctx.globalAlpha = 0.7;
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.globalAlpha = 1.0;

            const newBase64Data = canvas.toDataURL(originalMimeType).split(',')[1];
            resolve({ image: newBase64Data, mimeType: originalMimeType });
        };

        img.onload = () => { imgLoaded = true; if (maskLoaded) onBothLoaded(); };
        maskImg.onload = () => { maskLoaded = true; if (imgLoaded) onBothLoaded(); };
        img.onerror = (err) => reject(err);
        maskImg.onerror = (err) => reject(err);

        img.src = base64Image;
        maskImg.src = base64Mask;
    });
};


const getRealismGuidance = (level: RealismLevel): string => {
    switch(level) {
        case 'high':
            return "The final result must be photorealistic and indistinguishable from a real high-resolution photograph. Pay extreme attention to the finest details of the fabric texture, lighting, shadows, and how the materials interact.";
        case 'mid':
            return "The final result should be realistic and blend seamlessly. Focus on good lighting, plausible textures, and accurate shadows to create a believable image.";
        case 'low':
            return "A stylized or artistic result is acceptable. The focus is on the concept, not perfect realism. The output can look more like a digital illustration or have a 'generated' aesthetic.";
        default:
            return "The final result should be realistic and blend seamlessly.";
    }
}

const getPromptForAction = (
    action: EditAction, 
    realismLevel: RealismLevel, 
    modifyPrompt?: string,
    recolorValue?: string,
    stylizeValue?: string
): string => {
    const realismGuidance = getRealismGuidance(realismLevel);
    const selectionGuidance = "The green-overlaid area is your target for the edit. Do not include the green overlay in the final image. Preserve all content outside this area perfectly.";

    switch(action) {
        case 'remove':
            return `Instruction: Make the content within the green-overlaid area(s) completely transparent. ${selectionGuidance}`;
        case 'fix':
            return `Instruction: Perform a content-aware repair on the content within the green-overlaid area(s). ${realismGuidance} The result must blend seamlessly. ${selectionGuidance}`;
        case 'modify':
            if (!modifyPrompt) throw new Error("Modify action requires a prompt.");
            return `Instruction: Modify the content within the green-overlaid area(s) to be: "${modifyPrompt}". ${realismGuidance} The result must blend seamlessly. ${selectionGuidance}`;
        case 'recolor':
            return `Instruction: Change the color of the content within the green-overlaid area(s) to ${recolorValue}. Preserve the original texture, lighting, and shadows perfectly. The result must blend seamlessly. ${selectionGuidance}`;
        case 'stylize':
            return `Instruction: Redraw the content within the green-overlaid area(s) in the style of: "${stylizeValue}". ${realismGuidance} Blend the edges of the stylized area into the surrounding image. ${selectionGuidance}`;
        case 'enhance':
            return `Instruction: Globally enhance the entire image. ${realismGuidance} Improve detail, sharpness, lighting, and color vibrancy. If the original image has a transparent background (alpha channel), you MUST preserve the transparency perfectly in the output. Output only the single, enhanced image.`;
        case 'fill':
            return `Instruction: Perform a content-aware fill on the transparent or selected areas indicated by the green overlay. Your task is to intelligently analyze the surrounding patterns, colors, and textures and seamlessly extend them into the selected area. The final result must be perfectly blended and look natural. ${realismGuidance} ${selectionGuidance}`;
        case 'remove-bg':
             return `Instruction: Perform a precise background removal on this image. Identify the primary foreground subject, preserve it perfectly, and make the entire background transparent. Output only the resulting image.`;
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

export const editImageWithGemini = async (
    originalImage: string, // Full data URI: "data:image/png;base64,..."
    mask: string | null,
    action: EditAction,
    modifyPrompt: string | undefined,
    realismLevel: RealismLevel,
    recolorValue?: string,
    stylizeValue?: string
): Promise<string> => {
    try {
        const prompt = getPromptForAction(action, realismLevel, modifyPrompt, recolorValue, stylizeValue);
        const originalMimeType = originalImage.substring(originalImage.indexOf(":") + 1, originalImage.indexOf(";"));
        let imageData = originalImage.split(',')[1];
        let imageMimeType = originalMimeType;

        const needsDrawing = (action !== 'enhance' && action !== 'remove-bg') && mask;
        
        if (needsDrawing) {
            const drawn = await drawInstructionsOnImage(originalImage, mask);
            imageData = drawn.image;
            imageMimeType = drawn.mimeType;
        }

        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: imageMimeType,
            },
        };

        const textPart = { text: prompt };
        const parts = [imagePart, textPart];

        // Call our secure backend proxy instead of the Google API directly
        const fetchResponse = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ parts }),
        });
        
        if (!fetchResponse.ok) {
            const errorBody = await fetchResponse.json();
            throw new Error(errorBody.error || `Request failed with status ${fetchResponse.status}`);
        }

        const response = await fetchResponse.json();
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    const base64ImageBytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    return `data:${mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Request blocked due to ${response.promptFeedback.blockReason}.`);
        }

        const textResponse = response.text?.trim();
        if (textResponse) {
             throw new Error(`Model refused request with message: "${textResponse}"`);
        }

        throw new Error("No image was returned from the AI. The model may have refused the request for an unknown reason.");

    } catch (error: any) {
        console.error("Error editing image via proxy:", error);
        if (error.toString().includes('RESOURCE_EXHAUSTED')) {
             throw new Error("Failed to edit image: API quota has been exceeded. Please try again later. (RESOURCE_EXHAUSTED)");
        }
        throw new Error(`Failed to edit image: ${error.message}`);
    }
};
