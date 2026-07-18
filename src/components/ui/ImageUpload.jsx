'use client';

import React, { useState, useRef } from 'react';

export default function ImageUpload({ label, value, onChange, required = false, compact = false }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Crear formData para enviar
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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={compact ? {} : { marginBottom: '16px' }}>
      {!compact && (
        <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
          {label} {required && '*'}
        </label>
      )}
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Campo de URL */}
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

        {/* Botón de carga local */}
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

      {/* Vista previa de imagen si existe la URL */}
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
              e.currentTarget.style.display = 'none'; // Ocultar si la URL no es válida
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
