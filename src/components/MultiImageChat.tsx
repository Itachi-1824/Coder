'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Image as ImageIcon, Loader, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface UploadedImage {
  id: string;
  file: File;
  localUrl: string;
  hostedUrl?: string;
  analysis?: string;
  isAnalyzing: boolean;
  isUploading: boolean;
  name: string;
  size: number;
}

interface MultiImageChatProps {
  onImagesAnalyzed: (images: UploadedImage[], combinedAnalysis: string) => void;
  maxImages?: number;
}

export default function MultiImageChat({ onImagesAnalyzed, maxImages = 10 }: MultiImageChatProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload to catbox.moe (free temporary hosting)
  const uploadToCatbox = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);

    try {
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Catbox upload failed');
      }

      const url = await response.text();
      return url.trim();
    } catch (error) {
      console.error('Catbox upload failed:', error);
      // Fallback to other services or local URL
      return await uploadToImgBB(file);
    }
  };

  // Fallback to imgBB
  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Using a demo API key - in production, use your own
      const response = await fetch('https://api.imgbb.com/1/upload?key=demo', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.url;
      }
    } catch (error) {
      console.error('ImgBB upload failed:', error);
    }

    // Final fallback to local URL
    return URL.createObjectURL(file);
  };

  // Analyze image using AI
  const analyzeImage = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_POLLINATIONS_API_URL || 'https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_POLLINATIONS_REFERRER || '',
          'token': process.env.NEXT_PUBLIC_POLLINATIONS_TOKEN || ''
        },
        body: JSON.stringify({
          model: 'openai-large',
          messages: [
            {
              role: 'system',
              content: 'You are an expert image analyzer. Provide detailed analysis of images including content, style, technical details, and potential implementation ideas.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image in detail. Describe what you see, any UI elements, code patterns, design concepts, or technical implementations that could be built based on this image.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const responseText = await response.text();
      
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.choices?.[0]?.message?.content) {
          return jsonResponse.choices[0].message.content;
        }
      } catch {
        console.warn('Could not parse AI response as JSON, using raw text');
      }

      return responseText;
    } catch (error) {
      console.error('Image analysis failed:', error);
      return `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = [];
    const filesToProcess = Array.from(files).slice(0, maxImages - images.length);

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;

      const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newImage: UploadedImage = {
        id: imageId,
        file,
        localUrl: URL.createObjectURL(file),
        isAnalyzing: false,
        isUploading: false,
        name: file.name,
        size: file.size
      };

      newImages.push(newImage);
    }

    setImages(prev => [...prev, ...newImages]);

    // Process each image
    for (const image of newImages) {
      processImage(image.id);
    }
  }, [images.length, maxImages]);

  const processImage = useCallback(async (imageId: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, isUploading: true }
        : img
    ));

    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      // Upload to hosting service
      const hostedUrl = await uploadToCatbox(image.file);
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, hostedUrl, isUploading: false, isAnalyzing: true }
          : img
      ));

      // Analyze the image
      const analysis = await analyzeImage(hostedUrl);

      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, analysis, isAnalyzing: false }
          : img
      ));

    } catch (error) {
      console.error('Error processing image:', error);
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, isUploading: false, isAnalyzing: false }
          : img
      ));
    }
  }, [images]);

  const removeImage = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      URL.revokeObjectURL(image.localUrl);
    }
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSendImages = () => {
    if (images.length === 0) return;

    setIsProcessing(true);

    // Combine all analyses
    const analyses = images
      .filter(img => img.analysis)
      .map((img, index) => `**Image ${index + 1}: ${img.name}**\n${img.analysis}`)
      .join('\n\n---\n\n');

    const combinedAnalysis = `I've uploaded ${images.length} image(s) for analysis:\n\n${analyses}\n\nPlease help me understand what can be built or implemented based on these images.`;

    onImagesAnalyzed(images, combinedAnalysis);
    
    // Clear images after sending
    images.forEach(img => URL.revokeObjectURL(img.localUrl));
    setImages([]);
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const allImagesProcessed = images.length > 0 && images.every(img => !img.isUploading && !img.isAnalyzing);

  return (
    <div className="w-full space-y-3">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
            dragOver 
              ? 'border-blue-400 bg-blue-400/10 scale-105' 
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <ImageIcon size={24} className="text-gray-400" />
            <p className="text-sm text-gray-400">
              Drop images here or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500">
              {images.length}/{maxImages} images • PNG, JPG, WebP supported
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Image Grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {images.map((image) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative bg-gray-800 rounded-lg overflow-hidden"
              >
                <div className="aspect-square relative">
                  <Image
                    src={image.localUrl}
                    alt={image.name}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Loading Overlay */}
                  {(image.isUploading || image.isAnalyzing) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <Loader size={20} className="animate-spin mx-auto mb-1" />
                        <p className="text-xs text-white">
                          {image.isUploading ? 'Uploading...' : 'Analyzing...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded-full"
                  >
                    <X size={12} />
                  </button>

                  {/* Status Indicator */}
                  <div className="absolute bottom-1 left-1">
                    {image.analysis && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-xs text-gray-400 truncate">{image.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Button */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ImageIcon size={16} />
            <span>{images.length} image(s) ready</span>
            {!allImagesProcessed && <Loader size={14} className="animate-spin" />}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                images.forEach(img => URL.revokeObjectURL(img.localUrl));
                setImages([]);
              }}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Clear all images"
            >
              <Trash2 size={16} />
            </button>
            
            <button
              onClick={handleSendImages}
              disabled={!allImagesProcessed || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send size={16} />
              Send & Analyze
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
