import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Check, Loader2, AlertCircle } from 'lucide-react';
import { ClothingCategory, WardrobeItem } from '../types/fashion';
import { analyzeGarmentImage, createWardrobeItem } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: WardrobeItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onItemAdded }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [subcategory, setSubcategory] = useState<string>('oxford_shirt');
  const [colorName, setColorName] = useState<string>('Natural Ivory');
  const [colorHex, setColorHex] = useState<string>('#FAF5EE');
  const [material, setMaterial] = useState<string>('Cotton Blend');
  const [fit, setFit] = useState<'slim' | 'tailored' | 'regular' | 'relaxed' | 'oversized'>('regular');
  const [formalityScore, setFormalityScore] = useState<number>(5);
  const [pattern, setPattern] = useState<'solid' | 'striped' | 'plaid' | 'floral' | 'textured' | 'graphic'>('solid');

  if (!isOpen) return null;

  const resetForm = () => {
    setImagePreview(null);
    setName('');
    setColorName('Natural Ivory');
    setColorHex('#FAF5EE');
    setMaterial('Cotton Blend');
    setFit('regular');
    setFormalityScore(5);
    setCategory('top');
    setPattern('solid');
    setSaveError(null);
    setIsAnalyzing(false);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Helper to compress uploaded images for instant performance & reliability
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 960;
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setSaveError(null);
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
        
        // Immediate friendly default name so save is never blocked
        if (!name.trim()) {
          setName('My Clothes');
        }
        
        await runAiAnalysis(compressedBase64);
      } catch (err) {
        console.warn('File processing fallback:', err);
      }
    }
  };

  const runAiAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const attributes = await analyzeGarmentImage(base64);
      if (attributes) {
        if (attributes.name) setName(attributes.name);
        if (attributes.category) setCategory(attributes.category);
        if (attributes.subcategory) setSubcategory(attributes.subcategory);
        if (attributes.primaryColor) {
          setColorName(attributes.primaryColor.name || 'Classic Shade');
          setColorHex(attributes.primaryColor.hex || '#333333');
        }
        if (attributes.material) setMaterial(attributes.material);
        if (attributes.fit) setFit(attributes.fit);
        if (attributes.formalityScore) setFormalityScore(attributes.formalityScore);
        if (attributes.pattern) setPattern(attributes.pattern);
      }
    } catch (err) {
      console.warn('AI analysis fallback used:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    // Provide a smart default name if the user left it blank
    const fallbackCategoryName = 
      category === 'top' ? 'Shirt' : 
      category === 'bottom' ? 'Trousers' : 
      category === 'outerwear' ? 'Jacket' : 
      category === 'footwear' ? 'Shoes' : 'Clothes';
    
    const finalName = name.trim() || `${colorName} ${fallbackCategoryName}`;
    
    setIsSaving(true);
    setSaveError(null);
    try {
      const newItem = await createWardrobeItem({
        name: finalName,
        category,
        subcategory,
        primaryColor: {
          name: colorName || 'Classic Shade',
          hex: colorHex || '#333333',
          temperature: 'neutral'
        },
        pattern,
        material: material || 'Cotton',
        texture: 'textured',
        fit,
        formalityScore,
        seasonality: ['spring', 'summer', 'fall', 'winter'],
        imageUrl: imagePreview || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
        versatilityTags: ['essential', 'smart_casual']
      });

      // Pass item back to parent state
      onItemAdded(newItem);
      
      // Clean reset and close modal
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error saving item to closet:', err);
      setSaveError(err.message || 'Could not save to closet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#ECE5DB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#ECE5DB] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-amber-300 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-neutral-900 leading-tight">
                Add Clothes to Closet
              </h3>
              <p className="text-[11px] text-neutral-500">
                Upload a photo to automatically detect style, colors & fit
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-neutral-200/60 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Error Notice */}
          {saveError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Photo of Your Clothes
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-neutral-900 hover:underline cursor-pointer"
                >
                  Change Photo
                </button>
              )}
            </div>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-2xl p-6 text-center cursor-pointer transition-all bg-neutral-50/60 hover:bg-neutral-50 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-700 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-neutral-800">
                  Click to upload or drag & drop a photo
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Supports JPG, PNG, WEBP from phone or desktop
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 h-48 sm:h-56 bg-neutral-900/5 flex items-center justify-center">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-amber-300" />
                    <span className="text-xs font-semibold tracking-wider uppercase">
                      Detecting clothing type and colors...
                    </span>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Garment Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Clothing Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cream Linen Shirt"
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
              >
                <option value="top">Top (Shirt, T-Shirt, Sweater)</option>
                <option value="bottom">Bottom (Pants, Jeans, Chinos, Shorts)</option>
                <option value="outerwear">Outerwear (Jacket, Coat, Blazer)</option>
                <option value="footwear">Shoes (Sneakers, Boots, Loafers)</option>
                <option value="accessory">Accessory (Belt, Bag, Hat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Main Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-neutral-300 p-0.5 cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Color name (e.g. Olive Green)"
                  className="flex-1 border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Fabric / Material
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Cotton, Denim, Linen"
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                How It Fits
              </label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as any)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
              >
                <option value="slim">Slim Fit (Close to body)</option>
                <option value="tailored">Tailored Fit (Clean & sharp)</option>
                <option value="regular">Regular Fit (Standard)</option>
                <option value="relaxed">Relaxed Fit (Loose & easy)</option>
                <option value="oversized">Oversized Fit (Roomy)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  How Dressy Is It?
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">
                  {formalityScore <= 3 ? 'Casual (Everyday)' : formalityScore <= 6 ? 'Smart Casual (Dinner/Work)' : 'Dressy (Formal)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formalityScore}
                onChange={(e) => setFormalityScore(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#ECE5DB] flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Saving to Closet...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>Save to My Closet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
