'use client';

import React, { useState, useRef } from 'react';

export default function ImageUpload({ label, value, onChange, required = false, compact = false, multiple = false }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const fileInputRef = useRef(null);

  // --- Single file mode (backward compat) ---
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        onChange(data.url);
      } else {
        alert(data.error || 'Ocurrió un error al subir el archivo.');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error de conexión al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  // --- Multi file mode ---
  const handleMultiFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const urls = Array.isArray(value) ? [...value] : [];
    const errors = [];

    setUploading(true);
    setUploadErrors([]);

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (response.ok && data.url) {
          urls.push(data.url);
        } else {
          errors.push(data.error || `Error al subir ${file.name}`);
        }
      } catch (error) {
        console.error(`Error al subir ${file.name}:`, error);
        errors.push(`Error de conexión al subir ${file.name}`);
      }
    }

    setUploadErrors(errors);
    if (multiple && onChange) {
      onChange(urls);
    }
    setUploading(false);
  };

  const handleRemoveImage = (index) => {
    if (!multiple || !Array.isArray(value)) return;
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const urlArray = multiple ? (Array.isArray(value) ? value : []) : [value];

  // --- Multi-image render ---
  if (multiple) {
    return (
      <div style={compact ? {} : { marginBottom: '16px' }}>
        {!compact && (
          <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
            {label} {required && '*'}
          </label>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMultiFileChange}
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-gold)',
              border: '1px solid var(--color-gold)',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                e.currentTarget.style.color = 'var(--color-bg-dark)';
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-gold)';
              }
            }}
          >
            {uploading ? 'Subiendo...' : 'Agregar imágenes'}
          </button>
          {uploading && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Subiendo {urlArray.length} de {urlArray.length + (fileInputRef.current?.files?.length || 0)}...
            </span>
          )}
        </div>

        {/* Thumbnail grid */}
        {urlArray.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {urlArray.map((url, index) => (
              <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                <img
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid rgba(215,176,106,0.2)',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={uploading}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,85,85,0.5)',
                    backgroundColor: 'rgba(18,9,11,0.9)',
                    color: '#ff5555',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadErrors.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {uploadErrors.map((err, i) => (
              <p key={i} style={{ color: '#ff5555', fontSize: '0.8rem', margin: '2px 0' }}>{err}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Single-file render (unchanged) ---
  return (
    <div style={compact ? {} : { marginBottom: '16px' }}>
      {!compact && (
        <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
          {label} {required && '*'}
        </label>
      )}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de la imagen o sube un archivo"
          required={required}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(215,176,106,0.2)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={uploading}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-gold)',
            border: '1px solid var(--color-gold)',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            opacity: uploading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.backgroundColor = 'var(--color-gold)';
              e.currentTarget.style.color = 'var(--color-bg-dark)';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-gold)';
            }
          }}
        >
          {uploading ? 'Subiendo...' : 'Subir Archivo'}
        </button>
      </div>

      {value && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={value}
            alt="Vista previa"
            style={{
              width: compact ? '40px' : '60px',
              height: compact ? '40px' : '60px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid rgba(215,176,106,0.2)'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {!compact && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
              Imagen cargada correctamente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
