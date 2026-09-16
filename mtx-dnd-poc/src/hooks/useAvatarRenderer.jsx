import { useState, useEffect } from 'react';

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const useAvatarRenderer = (layers) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const renderAvatar = async () => {
      setIsRendering(true);
      try {
        // Ensure we have at least one layer to get dimensions from
        if (!layers || layers.length === 0 || !layers[0].src) {
           setIsRendering(false);
           return;
        }

        // 1. Get exact pixel dimensions from the very first layer (the body)
        const baseImg = await loadImage(layers[0].src);
        const w = baseImg.width;
        const h = baseImg.height;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = w;
        bufferCanvas.height = h;
        const bufferCtx = bufferCanvas.getContext('2d');
        bufferCtx.imageSmoothingEnabled = false;

        // 2. Process every layer in order
        for (const layer of layers) {
          if (!layer.src) continue;
          const img = await loadImage(layer.src);

          // If a color is provided, tint the mask!
          if (layer.color) {
            bufferCtx.clearRect(0, 0, w, h);
            bufferCtx.drawImage(img, 0, 0, w, h);

            bufferCtx.globalCompositeOperation = 'source-in';
            bufferCtx.fillStyle = layer.color;
            bufferCtx.fillRect(0, 0, w, h);

            bufferCtx.globalCompositeOperation = 'multiply';
            bufferCtx.drawImage(img, 0, 0, w, h);

            bufferCtx.globalCompositeOperation = 'source-over'; 
            ctx.drawImage(bufferCanvas, 0, 0, w, h);
          } else {
            // If no color is provided, just draw the image exactly as is
            ctx.drawImage(img, 0, 0, w, h);
          }
        }

        if (!isCancelled) {
          setAvatarUrl(canvas.toDataURL('image/png'));
          setIsRendering(false);
        }

      } catch (err) {
        console.error("Failed to render avatar:", err);
        setIsRendering(false);
      }
    };

    renderAvatar();

    return () => {
      isCancelled = true;
    };
  }, [layers]);

  return { avatarUrl, isRendering };
};