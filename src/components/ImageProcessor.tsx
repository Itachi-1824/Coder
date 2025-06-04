'use client';

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageProcessorProps {
  onImageAnalyzed: (analysis: string, imageUrl: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface UploadedImage {
  file: File;
  url: string;
  name: string;
  size: number;
}

export default function ImageProcessor({ onImageAnalyzed, onClose, isOpen }: ImageProcessorProps) {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const url = URL.createObjectURL(file);
    setUploadedImage({
      file,
      url,
      name: file.name,
      size: file.size
    });
    setAnalysisResult('');
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

  const uploadToTemporaryHosting = async (file: File): Promise<string> => {
    // Using a temporary image hosting service
    // In a real application, you'd want to use your own backend or a service like Cloudinary
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Using imgbb as a temporary hosting solution
      const response = await fetch('https://api.imgbb.com/1/upload?key=your-api-key', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.data.url;
    } catch (error) {
      console.error('Image upload failed, using local URL:', error);
      // Fallback to local URL for development
      return URL.createObjectURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);
    try {
      // Upload image to temporary hosting
      const imageUrl = await uploadToTemporaryHosting(uploadedImage.file);

      const payload = {
        model: "openai-large",
        messages: [
          {
            role: "system",
            content: "You are an expert image analyzer. Describe the image in detail including subject, style, composition, colors, lighting, and any notable elements. Provide a comprehensive analysis that will be used as context for further conversation about code generation or technical implementation."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image thoroughly and provide a detailed description. Include all visual elements, style, composition, colors, objects, people, text, and any other notable features. Describe the image in high details and tell me what could be implemented or coded based on this image."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 128000,
        token: process.env.NEXT_PUBLIC_POLLINATIONS_TOKEN || "L0jejdsYQOrz1lFp",
        referrer: process.env.NEXT_PUBLIC_POLLINATIONS_REFERRER || "L0jejdsYQOrz1lFp"
      };

      const response = await fetch(process.env.NEXT_PUBLIC_POLLINATIONS_API_URL || 'https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': process.env.NEXT_PUBLIC_POLLINATIONS_REFERRER || 'L0jejdsYQOrz1lFp',
          'token': process.env.NEXT_PUBLIC_POLLINATIONS_TOKEN || 'L0jejdsYQOrz1lFp'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      let analysis = responseText;
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.choices && jsonResponse.choices[0] && jsonResponse.choices[0].message) {
          analysis = jsonResponse.choices[0].message.content;
        }
      } catch (parseError) {
        console.warn('Could not parse AI response as JSON, using raw text:', parseError);
      }

      setAnalysisResult(analysis);
      onImageAnalyzed(analysis, imageUrl);

    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisResult(`Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.url);
    }
    setUploadedImage(null);
    setAnalysisResult('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-600">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-blue-400" size={20} />
              <h2 className="text-lg font-semibold">Image Processor</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
            {!uploadedImage ? (
              // Upload Area
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-400/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Image for Analysis</h3>
                <p className="text-gray-400 mb-4">
                  Drag and drop an image here, or click to select
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Select Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Supports: PNG, JPG, JPEG, GIF, WebP
                </p>
              </div>
            ) : (
              // Image Preview and Analysis
              <div className="space-y-6">
                {/* Image Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{uploadedImage.name}</h3>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(uploadedImage.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Image'
                      )}
                    </button>
                    <button
                      onClick={clearImage}
                      className="p-2 hover:bg-gray-700 rounded text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div>
                    <h4 className="font-medium mb-3">Preview</h4>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <img
                        src={uploadedImage.url}
                        alt={`Preview of ${uploadedImage.name}`}
                        className="w-full h-auto max-h-64 object-contain rounded"
                      />
                    </div>
                  </div>

                  {/* Analysis Result */}
                  <div>
                    <h4 className="font-medium mb-3">Analysis Result</h4>
                    <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
                      {isAnalyzing ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader size={32} className="animate-spin mx-auto mb-2" />
                            <p className="text-gray-400">Analyzing image...</p>
                          </div>
                        </div>
                      ) : analysisResult ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm">{analysisResult}</pre>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          Click &quot;Analyze Image&quot; to get detailed analysis
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {analysisResult && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(analysisResult)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      <Download size={16} />
                      Copy Analysis
                    </button>
                    <button
                      onClick={() => {
                        onImageAnalyzed(analysisResult, uploadedImage.url);
                        onClose();
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      Use in Chat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
