import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCrop, onCancel, shape = 'circle' }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [image, setImage] = useState(null);

    // Load image
    useEffect(() => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = imageSrc;
    }, [imageSrc]);

    // Draw to preview canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        // Fill bg
        ctx.fillStyle = '#1e1f22';
        ctx.fillRect(0, 0, size, size);

        // Scale image to fit then apply zoom
        const scale = Math.max(size / image.width, size / image.height) * zoom;
        const drawW = image.width * scale;
        const drawH = image.height * scale;
        const drawX = (size - drawW) / 2 + offset.x;
        const drawY = (size - drawH) / 2 + offset.y;

        // Clip to shape
        ctx.save();
        ctx.beginPath();
        if (shape === 'circle') {
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        } else {
            // Square with rounded corners for server icons
            ctx.roundRect(0, 0, size, size, 24);
        }
        ctx.clip();
        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Draw shape overlay
        ctx.strokeStyle = 'rgba(88, 101, 242, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (shape === 'circle') {
            ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        } else {
            ctx.roundRect(1, 1, size - 2, size - 2, 24);
        }
        ctx.stroke();
    }, [image, zoom, offset, shape]);

    useEffect(() => { draw(); }, [draw]);

    const handleMouseDown = (e) => {
        setDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => setDragging(false);

    // Touch events for mobile
    const handleTouchStart = (e) => {
        const t = e.touches[0];
        setDragging(true);
        setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
    };
    const handleTouchMove = (e) => {
        if (!dragging) return;
        const t = e.touches[0];
        setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    };

    const handleCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Export as high-quality data URL
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 256;
        exportCanvas.height = 256;
        const ctx = exportCanvas.getContext('2d');

        if (image) {
            const size = 256;
            const scale = Math.max(size / image.width, size / image.height) * zoom;
            const drawW = image.width * scale;
            const drawH = image.height * scale;
            const drawX = (size - drawW) / 2 + offset.x;
            const drawY = (size - drawH) / 2 + offset.y;

            ctx.beginPath();
            if (shape === 'circle') {
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            } else {
                ctx.roundRect(0, 0, size, size, 24);
            }
            ctx.clip();
            ctx.drawImage(image, drawX, drawY, drawW, drawH);
        }

        const dataUrl = exportCanvas.toDataURL('image/png', 0.95);
        onCrop(dataUrl);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
            <div className="relative bg-[#313338] rounded-xl p-6 shadow-2xl border border-[#3f4147] max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-white mb-4">Crop Your {shape === 'square' ? 'Icon' : 'Avatar'}</h3>

                {/* Canvas preview */}
                <div
                    ref={containerRef}
                    className={`relative mx-auto w-[256px] h-[256px] ${shape === 'circle' ? 'rounded-full' : 'rounded-3xl'} overflow-hidden cursor-grab active:cursor-grabbing bg-[#1e1f22] mb-4 select-none`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                    />
                </div>

                {/* Zoom slider */}
                <div className="flex items-center gap-3 mb-5 px-2">
                    <ZoomOut size={16} className="text-[#949ba4] flex-shrink-0" />
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-[#4f545c] rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                    />
                    <ZoomIn size={16} className="text-[#949ba4] flex-shrink-0" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-[#b5bac1] hover:text-white hover:underline transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCrop}
                        className="px-5 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-sm font-medium text-white transition-colors"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ImageCropper;
