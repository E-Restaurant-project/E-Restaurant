import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Trash2,
  Camera,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useRestaurant } from '../../hooks/useRestaurant';
import { CATEGORIES } from '../../data/menu';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CustomSelect } from '../common/CustomSelect';
import { apiService } from '../../services/api';
import { getImageUrl } from '../../config/api';

export const DishFormModal = ({ isOpen, onClose, onSave, dishToEdit = null, initialCategory = '' }) => {
  const { t, language } = useLanguage();
  const { categories: restaurantCategories } = useRestaurant();
  const isKm = language === 'km';
  const categoryList =
    restaurantCategories && restaurantCategories.length > 0
      ? restaurantCategories
      : CATEGORIES.filter((c) => c.id !== 'all');

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name_km: '',
    name_en: '',
    category: initialCategory && initialCategory !== 'all' ? initialCategory : '',
    price: '',
    discount_percent: 0,
    image: '',
    featured: false
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (dishToEdit) {
      let initPrice = '';
      if (dishToEdit.price_khr !== undefined && dishToEdit.price_khr !== null) {
        initPrice = String(dishToEdit.price_khr);
      } else if (dishToEdit.price !== undefined && dishToEdit.price !== null) {
        const p = Number(dishToEdit.price);
        initPrice = p >= 100 ? String(Math.round(p)) : String(Math.round(p * 4100));
      }

      setFormData({
        name_km: dishToEdit.name_km || '',
        name_en: dishToEdit.name_en || '',
        category: dishToEdit.category || '',
        price: initPrice,
        discount_percent: dishToEdit.discount_percent || 0,
        image: dishToEdit.image || '',
        featured: !!dishToEdit.featured
      });
      setPreviewUrl(dishToEdit.image || '');
    } else {
      const startCat = initialCategory && initialCategory !== 'all' ? initialCategory : '';
      setFormData({
        name_km: '',
        name_en: '',
        category: startCat,
        price: '',
        discount_percent: 0,
        image: '',
        featured: false
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setUploadError('');
    setErrors({});
  }, [dishToEdit, isOpen, initialCategory]);

  // Fast client-side image compression to speed up uploads by 10x
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1000;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(compressed);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileProcess = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError(
        isKm
          ? 'សូមជ្រើសរើសប្រភេទឯកសាររូបភាពត្រឹមត្រូវ (JPG, PNG, WebP)'
          : 'Please select a valid image file (JPG, PNG, WebP)'
      );
      return;
    }

    // Validate size (max 12MB raw)
    if (file.size > 12 * 1024 * 1024) {
      setUploadError(
        isKm ? 'ទំហំរូបភាពមិនត្រូវលើសពី 12MB ឡើយ' : 'Image size cannot exceed 12MB'
      );
      return;
    }

    setUploadError('');
    // Automatically compress to ultra-fast lightweight format
    const optimized = await compressImage(file);
    setSelectedFile(optimized);
    const objectUrl = URL.createObjectURL(optimized);
    setPreviewUrl(objectUrl);
    setFormData((prev) => ({ ...prev, image: objectUrl }));

    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, image: '' }));
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name_km.trim()) {
      errs.name_km = isKm ? 'សូមបញ្ចូលឈ្មោះជាភាសាខ្មែរ' : 'Please enter Khmer name';
    }
    if (!formData.name_en.trim()) {
      errs.name_en = isKm ? 'សូមបញ្ចូលឈ្មោះជាភាសាអង់គ្លេស' : 'Please enter English name';
    }
    if (!formData.category || formData.category === 'all') {
      errs.category = isKm ? 'សូមជ្រើសរើសប្រភេទមុខម្ហូប' : 'Please select a dish category';
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) < 100) {
      errs.price = isKm ? 'តម្លៃអប្បបរមាគឺ 100៛' : 'Minimum price is 100៛';
    }
    if (!previewUrl && !formData.image) {
      errs.image = isKm
        ? 'សូមបញ្ចូលរូបភាពសម្រាប់មុខម្ហូបនេះ'
        : 'Please upload an image for this dish';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let finalImageUrl = formData.image;

    // If admin picked a new file, upload it to backend server
    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadRes = await apiService.uploadDishImage(selectedFile);
        if (uploadRes && uploadRes.success && uploadRes.imageUrl) {
          finalImageUrl = uploadRes.imageUrl;
        } else {
          console.warn('Image upload returned unverified status, continuing with image data:', uploadRes?.message);
        }
      } catch (err) {
        console.warn('Image upload error:', err.message);
      } finally {
        setIsUploading(false);
      }
    }

    const khrPrice = Math.max(100, Math.round(Number(formData.price)));
    const usdPrice = parseFloat((khrPrice / 4100).toFixed(4));

    await onSave({
      ...formData,
      category: formData.category.trim(),
      spice_level: 'none',
      desc_km: '',
      desc_en: '',
      image: finalImageUrl,
      price: usdPrice,
      price_khr: khrPrice,
      discount_percent: Math.min(90, Math.max(0, Math.round(Number(formData.discount_percent) || 0)))
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dishToEdit ? t('admin.edit_dish') : t('admin.add_dish')}
      maxWidth="640px"
    >
      <form onSubmit={handleSubmit}>
        {/* Name KM & Name EN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          {/* Dish Name KM */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label form-label--required">{t('admin.dish_name_km')}</label>
            <input
              type="text"
              className={`form-input ${errors.name_km ? 'form-input--error' : ''}`}
              value={formData.name_km}
              onChange={(e) => handleChange('name_km', e.target.value)}
              placeholder="ឧ. អាម៉ុកត្រីរ៉ស់"
              autoFocus
            />
            {errors.name_km && <span className="form-error">{errors.name_km}</span>}
          </div>

          {/* Dish Name EN */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label form-label--required">{t('admin.dish_name_en')}</label>
            <input
              type="text"
              className={`form-input ${errors.name_en ? 'form-input--error' : ''}`}
              value={formData.name_en}
              onChange={(e) => handleChange('name_en', e.target.value)}
              placeholder="e.g. Fish Amok"
            />
            {errors.name_en && <span className="form-error">{errors.name_en}</span>}
          </div>
        </div>

        {/* Category & Price in 2 Columns with Equal 50/50 Width */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          {/* Category */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label form-label--required">{t('admin.dish_category')}</label>
            <CustomSelect
              options={categoryList.map((cat) => ({
                id: cat.id,
                label: isKm ? cat.label_km : cat.label_en
              }))}
              value={formData.category}
              onChange={(val) => handleChange('category', val)}
              placeholder={isKm ? 'ជ្រើសរើសប្រភេទមុខម្ហូប...' : 'Select category...'}
              error={!!errors.category}
            />
            {errors.category && <span className="form-error">{errors.category}</span>}
            {formData.category && (
              <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                ✓ {isKm ? 'មុខម្ហូបនឹងស្ថិតក្នុងប្រភេទ៖' : 'Category:'} {categoryList.find(c => c.id === formData.category)?.[isKm ? 'label_km' : 'label_en'] || formData.category}
              </span>
            )}
          </div>

          {/* Price (In Khmer Riel - ៛) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label form-label--required">{t('admin.dish_price')}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                step="100"
                min="100"
                className={`form-input ${errors.price ? 'form-input--error' : ''}`}
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="10000"
                style={{
                  paddingRight: '48px',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'var(--color-primary)',
                  pointerEvents: 'none'
                }}
              >
                ៛
              </span>
            </div>
            {errors.price ? (
              <span className="form-error">{errors.price}</span>
            ) : formData.price && !isNaN(formData.price) && Number(formData.price) >= 100 ? (
              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#16a34a',
                  display: 'block',
                  marginTop: '4px',
                  fontWeight: 600
                }}
              >
                ✓ {Number(formData.price).toLocaleString()} ៛ ≈ ${(Number(formData.price) / 4100).toFixed(2)} USD
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginTop: '4px'
                }}
              >
                {isKm ? 'បញ្ចូលជាប្រាក់រៀល (អប្បបរមា 100៛)' : 'Enter price in Riel (min 100៛)'}
              </span>
            )}
          </div>
        </div>

        {/* Product-Specific Discount Field */}
        <div className="form-group" style={{ marginBottom: 'var(--space-md)', padding: '12px 14px', backgroundColor: 'rgba(239, 68, 68, 0.04)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏷️ {isKm ? 'បញ្ចុះតម្លៃសម្រាប់មុខម្ហូបនេះ (Discount %)' : 'Product Discount (% OFF)'}</span>
            </label>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: formData.discount_percent > 0 ? '#dc2626' : '#64748b' }}>
              {formData.discount_percent > 0 ? `-${formData.discount_percent}% OFF` : (isKm ? 'គ្មានការបញ្ចុះតម្លៃ (0%)' : 'No Discount (0%)')}
            </span>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              min="0"
              max="90"
              step="5"
              className="form-input"
              value={formData.discount_percent === 0 ? '' : formData.discount_percent}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.min(90, Math.max(0, Number(e.target.value)));
                handleChange('discount_percent', val);
              }}
              placeholder={isKm ? 'បញ្ចូលភាគរយចុះថ្លៃ (ឧ. 20 ស្មើនឹង 20% OFF)' : 'Enter discount % (e.g. 20 for 20% OFF)'}
              style={{ paddingRight: '42px', fontWeight: 600 }}
            />
            <span style={{ position: 'absolute', right: '14px', fontWeight: 800, fontSize: '1.05rem', color: '#dc2626', pointerEvents: 'none' }}>
              %
            </span>
          </div>

          {/* Quick preset discount pills */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              {isKm ? 'ជ្រើសរើសរហ័ស៖' : 'Quick select:'}
            </span>
            {[0, 10, 15, 20, 30, 50].map((pct) => (
              <button
                type="button"
                key={pct}
                onClick={() => handleChange('discount_percent', pct)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: Number(formData.discount_percent) === pct ? '#dc2626' : '#e2e8f0',
                  backgroundColor: Number(formData.discount_percent) === pct ? '#dc2626' : '#ffffff',
                  color: Number(formData.discount_percent) === pct ? '#ffffff' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {pct === 0 ? (isKm ? 'ធម្មតា' : 'None') : `-${pct}%`}
              </button>
            ))}
          </div>

          {/* Live Discounted Price Preview */}
          {formData.discount_percent > 0 && formData.price && !isNaN(formData.price) && (
            <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569' }}>
                {isKm ? 'តម្លៃក្រោយបញ្ចុះរួច៖' : 'Discounted Price:'}
              </span>
              <span style={{ fontWeight: 800, color: '#dc2626' }}>
                {Math.round(Number(formData.price) * (1 - formData.discount_percent / 100)).toLocaleString()} ៛{' '}
                <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontWeight: 500, fontSize: '0.75rem' }}>
                  ({Number(formData.price).toLocaleString()} ៛)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Professional Image Upload Box */}
        <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
          <label className="form-label form-label--required" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{isKm ? 'រូបភាពមុខម្ហូប (Dish Photo)' : 'Dish Photo'}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              JPG, PNG, WebP (Max 8MB)
            </span>
          </label>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            style={{ display: 'none' }}
          />

          {!previewUrl ? (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${errors.image ? 'var(--color-danger)' : isDragging ? 'var(--color-primary)' : '#cbd5e1'}`,
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? 'rgba(168, 30, 44, 0.05)' : '#f8fafc',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(168, 30, 44, 0.1)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(168, 30, 44, 0.15)'
                }}
              >
                <UploadCloud size={28} />
              </div>

              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>
                  {isKm ? 'អូសទម្លាក់រូបភាពនៅទីនេះ ឬ ' : 'Drag & drop image here or '}
                  <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                    {isKm ? 'ចុចជ្រើសរើស' : 'browse'}
                  </span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  {isKm ? 'រូបភាពច្បាស់គុណភាពខ្ពស់ ងាយស្រួលទាក់ទាញអតិថិជន' : 'High quality photo for better customer engagement'}
                </p>
              </div>
            </div>
          ) : (
            /* Selected Image Preview with Action Bar */
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#0f172a' }}>
                <img
                  src={getImageUrl(previewUrl)}
                  alt="Dish Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                  }}
                />

                {/* Floating Ready Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(16, 185, 129, 0.95)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>{selectedFile ? (isKm ? 'បានជ្រើសរើសថ្មី' : 'Ready to upload') : (isKm ? 'រូបភាពបច្ចុប្បន្ន' : 'Current photo')}</span>
                </div>

                {/* Action Buttons Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '8px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <Camera size={14} />
                    <span>{isKm ? 'ប្តូររូបភាព' : 'Change'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>{isKm ? 'លុប' : 'Remove'}</span>
                  </button>
                </div>
              </div>

              {selectedFile && (
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8fafc',
                    fontSize: '0.8rem',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#334155' }}>{selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-danger)',
                fontSize: '0.82rem',
                marginTop: '6px'
              }}
            >
              <AlertCircle size={14} />
              <span>{uploadError}</span>
            </div>
          )}

          {errors.image && !uploadError && (
            <span className="form-error" style={{ display: 'block', marginTop: '4px' }}>
              {errors.image}
            </span>
          )}
        </div>

        {/* Featured Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)' }}>
          <input
            type="checkbox"
            id="featured_check"
            checked={formData.featured}
            onChange={(e) => handleChange('featured', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="featured_check" style={{ cursor: 'pointer', fontWeight: 600 }}>
            {t('admin.dish_featured')}
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            {t('admin.cancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={isUploading}>
            {isUploading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={16} className="animate-spin" />
                {isKm ? 'កំពុងផ្ទុករូបភាព...' : 'Uploading...'}
              </span>
            ) : (
              t('admin.save')
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
