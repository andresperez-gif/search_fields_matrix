import React, { useState, useEffect } from 'react';

/**
 * SettingsMenu
 * A settings menu for configuring the matrix view
 * Props:
 *   open: boolean - whether the popover is open
 *   onClose: () => void - called to close the popover
 *   value: {rows: number, cols: number, useCardColor: boolean, colorSource: string} - current settings
 *   onChange: (settings) => void - called with new settings
 *   availableColorFields: Array<Field> - list of available color fields
 *   min: number - min value for rows/cols (default 1)
 *   max: number - max value for rows/cols (default 4)
 */
export default function SettingsMenu({ 
  open, 
  onClose, 
  value, 
  onChange, 
  availableColorFields = [],
  min = 1, 
  max = 4 
}) {
  // Initialize local state with the current value
  const [settings, setSettings] = useState(() => ({
    rows: value.rows || 2,
    cols: value.cols || 3,
    useCardColor: value.useCardColor !== false, // default to true if not specified
    colorSource: value.colorSource || null,
    showLegend: value.showLegend !== false // default to true if not specified
  }));

  // Update local state when the value prop changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      rows: value.rows || 2,
      cols: value.cols || 3,
      useCardColor: value.useCardColor !== false,
      colorSource: value.colorSource || null,
      showLegend: value.showLegend !== false
    }));
  }, [value]);

  if (!open) return null;
  const handleChange = (key, newValue) => {
    // If turning off card colors, also hide the legend
    const updates = { [key]: newValue };
    if (key === 'useCardColor' && !newValue) {
      updates.showLegend = false;
    }
    
    const updatedSettings = { ...settings, ...updates };
    setSettings(updatedSettings);
    // Apply all changes immediately
    onChange(updatedSettings);
  };

  return (
    <div className="rb-settings-menu" style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '8px',
      zIndex: 100,
      background: '#fafbfc',
      border: '1px solid #d9dbe0',
      borderRadius: 8,
      boxShadow: '0 4px 16px 0 rgba(20,20,20,0.13)',
      padding: '16px',
      minWidth: 280,
      fontFamily: 'Futura Condensed, Arial Narrow, Arial, sans-serif',
      fontSize: '1rem',
    }}>
      <div style={{ 
        fontWeight: 700, 
        fontSize: '1.1rem', 
        marginBottom: '16px', 
        color: '#002654',
        borderBottom: '2px solid #e3e5e8',
        paddingBottom: '8px'
      }}>
        Settings
      </div>



      {/* Card Layout Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#313131' }}>Card Layout</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ minWidth: '50px', color: '#666' }}>Rows:</span>
          <select 
            value={settings.rows} 
            onChange={e => handleChange('rows', Number(e.target.value))}
            style={{ 
              flex: 1, 
              border: '1px solid #d9dbe0', 
              borderRadius: 5, 
              padding: '4px 8px', 
              background: '#fff', 
              fontSize: '0.95em',
              color: '#313131',
              fontFamily: 'inherit'
            }}
          >
            {Array.from({length: max - min + 1}).map((_, i) => (
              <option key={`row-${i}`} value={i + min}>{i + min}</option>
            ))}
          </select>
          
          <span style={{ minWidth: '50px', marginLeft: '8px', color: '#666' }}>Cols:</span>
          <select 
            value={settings.cols} 
            onChange={e => handleChange('cols', Number(e.target.value))}
            style={{ 
              flex: 1,
              border: '1px solid #d9dbe0', 
              borderRadius: 5, 
              padding: '4px 8px', 
              background: '#fff', 
              fontSize: '0.95em',
              color: '#313131',
              fontFamily: 'inherit'
            }}
          >
            {Array.from({length: max - min + 1}).map((_, i) => (
              <option key={`col-${i}`} value={i + min}>{i + min}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Card Color Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px' 
        }}>
          <div style={{ fontWeight: 600, color: '#313131' }}>Card Colors</div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.useCardColor}
              onChange={e => handleChange('useCardColor', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>
        
        {settings.useCardColor && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ marginBottom: '6px', color: '#666' }}>Color Source:</div>
            <select 
              value={settings.colorSource}
              onChange={e => handleChange('colorSource', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d9dbe0',
                backgroundColor: '#fff',
                fontSize: '0.95em',
                fontFamily: 'inherit'
              }}
            >
              <option value="">Select a field...</option>
              {availableColorFields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Show Legend Toggle - Only show when card colors are enabled */}
      {settings.useCardColor && (
        <div style={{ 
          borderTop: '1px solid #e3e5e8',
          padding: '16px 0',
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: 600, color: '#313131' }}>Show Legend</div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.showLegend}
              onChange={e => handleChange('showLegend', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      )}
      
      <div style={{ 
        borderTop: '1px solid #e3e5e8',
        paddingTop: '16px',
        marginTop: '8px',
        textAlign: 'right'
      }}>
        <button 
          onClick={onClose}
          style={{
            padding: '6px 16px',
            background: '#002654',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.95em',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
