import {initializeBlock} from '@airtable/blocks/interface/ui';
import './style.css';

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import SettingsMenu from './CardLayoutSelector'; // This is now our SettingsMenu
import html2canvas from 'html2canvas';
import { GearIcon, Download } from '@phosphor-icons/react';
import {
    useBase,
    useRecords,
    useCustomProperties,
    useColorScheme,
    expandRecord
} from '@airtable/blocks/interface/ui';
import {FieldType} from '@airtable/blocks/interface/models';
import './style.css';

function RedBullMatrixApp() {
    // User-adjustable topic column width
    const [topicColWidth, setTopicColWidth] = useState(150);
    // Hover state for topic column border
    const [hoveredTopicCol, setHoveredTopicCol] = useState(false);
    // Create a ref for the container we want to capture
    const printRef = useRef(null);

    // Function to capture and download the matrix as an image
    const handlePrint = useCallback(async () => {
        try {
            // Find the main container that includes both matrix and legend
            const element = document.querySelector('.rb-matrix-root');
            if (!element) {
                console.error('Could not find matrix container');
                return;
            }

            // Use html2canvas to capture the element
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true, // Handle CORS if needed
                allowTaint: true, // Allow tainted canvas
                backgroundColor: '#ffffff', // White background
                logging: false, // Disable console logging
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
                onclone: (clonedDoc) => {
                    // Make sure all elements are visible in the cloned document
                    const elements = clonedDoc.querySelectorAll('*');
                    elements.forEach(el => {
                        const style = window.getComputedStyle(el);
                        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                            el.style.display = 'block';
                            el.style.visibility = 'visible';
                            el.style.opacity = '1';
                        }
                    });
                }
            });

            // Create a new window with the image
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                // If popup is blocked, download the image directly
                const link = document.createElement('a');
                link.download = `searchfields-matrix-${new Date().toISOString().split('T')[0]}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                return;
            }

            // Create a clean HTML document with the image
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>SearchFields Matrix - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            background-color: #f5f5f5;
                        }
                        .print-container {
                            max-width: 100%;
                            text-align: center;
                        }
                        .print-header {
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .print-header h1 {
                            color: #002654;
                            margin: 0 0 5px 0;
                        }
                        .print-date {
                            color: #666;
                            font-size: 14px;
                            margin-bottom: 15px;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        @media print {
                            body {
                                padding: 0;
                                background: none;
                            }
                            .print-header, .print-date {
                                display: none;
                            }
                            img {
                                box-shadow: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="print-header">
                            <h1>SearchFields Matrix</h1>
                            <div class="print-date">Generated on ${new Date().toLocaleString()}</div>
                        </div>
                        <img src="${canvas.toDataURL('image/png')}" alt="SearchFields Matrix" />
                    </div>
                    <script>
                        // Auto-print when the image is loaded
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            }, 500);
                        };
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Error capturing matrix:', error);
            alert('Error capturing matrix. Please try again.');
        }
    }, []);
    React.useEffect(() => {
        document.title = 'SearchFields Matrix';
    }, []);
    const base = useBase();
    const table = base.tables[0];
    // Custom properties for required fields
    const getCustomProperties = useCallback(
        (base) => {
            const table = base.tables[0];
            const fields = table.fields;
            return [
    {
        key: 'labelSource',
        label: 'Label Source',
        type: 'enum',
        possibleValues: [
            { value: 'field', label: 'Field values from records' },
            { value: 'static', label: 'Static labels (manual input)' },
        ],
        defaultValue: 'field',
    },
    {
        key: 'staticRowLabels',
        label: "Row Labels (separate with ';')",
        type: 'string',
        defaultValue: '',
        showIf: (props) => props.labelSource === 'static',
        multiline: true,
        description: "Enter all row labels separated by a semicolon (;)"
    },
    {
        key: 'staticColLabels',
        label: "Column Labels (separate with ';')",
        type: 'string',
        defaultValue: '',
        showIf: (props) => props.labelSource === 'static',
        multiline: true,
        description: "Enter all column labels separated by a semicolon (;)"
    },
    {
        key: 'cellRowCount',
        label: 'Cards per Cell: Rows',
        type: 'enum',
        possibleValues: [
            {value: '1', label: '1'},
            {value: '2', label: '2'},
            {value: '3', label: '3'},
            {value: '4', label: '4'},
        ],
        defaultValue: '2',
    },
    {
        key: 'cellColCount',
        label: 'Cards per Cell: Columns',
        type: 'enum',
        possibleValues: [
            {value: '1', label: '1'},
            {value: '2', label: '2'},
            {value: '3', label: '3'},
            {value: '4', label: '4'},
        ],
        defaultValue: '3',
    },
    {
        key: 'primaryField',
        label: 'Primary Field',
        type: 'field',
        table,
        possibleValues: fields.filter(f => f.type === FieldType.SINGLE_LINE_TEXT || f.type === FieldType.FORMULA),
    },
    {
        key: 'rowGroupField',
        label: 'Row Group Field',
        type: 'field',
        table,
        possibleValues: fields,
    },
    {
        key: 'columnGroupField',
        label: 'Column Group Field',
        type: 'field',
        table,
        possibleValues: fields,
    },
    {
        key: 'imageField',
        label: 'Image Field',
        type: 'field',
        table,
        possibleValues: fields.filter(f => f.type === FieldType.MULTIPLE_ATTACHMENTS),
    },
    {
        key: 'cardColor',
        label: 'Card Color (Single Select Field)',
        type: 'field',
        table,
        possibleValues: fields.filter(f => f.type === FieldType.SINGLE_SELECT),
    },
];
        },
        []
    );
    const {customPropertyValueByKey, errorState} = useCustomProperties(getCustomProperties);
    // Helper to get field ID from string or object
    function getFieldId(val) {
        return (val && typeof val === 'object' && 'id' in val) ? val.id : val;
    }
    // Get field objects
    const primaryField = table.getFieldByIdIfExists(getFieldId(customPropertyValueByKey.primaryField));
    const rowGroupField = table.getFieldByIdIfExists(getFieldId(customPropertyValueByKey.rowGroupField));
    const columnGroupField = table.getFieldByIdIfExists(getFieldId(customPropertyValueByKey.columnGroupField));
    const imageField = table.getFieldByIdIfExists(getFieldId(customPropertyValueByKey.imageField));
    const cardColor = table.getFieldByIdIfExists(getFieldId(customPropertyValueByKey.cardColor));
    // Only render config UI if not configured or fields missing
    const isConfigured = customPropertyValueByKey.primaryField && customPropertyValueByKey.rowGroupField && customPropertyValueByKey.columnGroupField && primaryField && rowGroupField && columnGroupField;
    if (!isConfigured) {
        // Debug info for troubleshooting
        const debugFields = table.fields.map(f => `${f.name} (${f.id}) [${f.type}]`).join('\n');
        // Show which fields are missing
        // Dump raw customPropertyValueByKey
        const debugRawProps = Object.entries(customPropertyValueByKey)
            .map(([k, v]) => {
                if (typeof v === 'object' && v !== null) {
                    if (v.id) return `${k}: [object with id=${v.id}]`;
                    return `${k}: [object]`;
                }
                return `${k}: ${v}`;
            })
            .join('\n');
        const debugFieldsStatus = [
            ['primaryField', customPropertyValueByKey.primaryField, primaryField],
            ['rowGroupField', customPropertyValueByKey.rowGroupField, rowGroupField],
            ['columnGroupField', customPropertyValueByKey.columnGroupField, columnGroupField],
            ['imageField', customPropertyValueByKey.imageField, imageField],
        ].map(([key, id, field]) => {
            if (!id) return `${key}: not set`;
            if (!field) return `${key}: ${id} (NOT FOUND)`;
            return `${key}: ${id} (found: ${field.name}, type: ${field.type})`;
        }).join('\n');
        const debugTableIds = table.fields.map(f => `${f.name}: ${f.id} [${f.type}]`).join('\n');
        return (
            <div className="airtable-config-popup">
                <div className="airtable-config-header">Configure Required Fields</div>
                <div className="airtable-config-desc">One or more selected fields could not be found in the table. Please check your Interface Extension settings for Primary, Row Group, and Column Group fields. (Image field is optional)</div>
                <details style={{textAlign:'left', margin:'16px auto', background:'#f8f8f8', borderRadius:8, padding:8, fontSize:'0.92em', maxWidth:320}}>
                    <summary>Debug info (for developer)</summary>
                    <div><b>Field mapping status:</b><br/><pre>{debugFieldsStatus}</pre></div>
                    <div><b>Raw customPropertyValueByKey:</b><br/><pre>{debugRawProps}</pre></div>
                    <div><b>Table fields (IDs):</b><br/><pre>{debugTableIds}</pre></div>
                </details>
                {errorState && <div className="airtable-config-error">{errorState.message}</div>}
            </div>
        );
    }
    // Fetch all records
    const records = useRecords(table);
    // Determine topics (rows) and domains (columns) based on label source
    const labelSource = customPropertyValueByKey.labelSource || 'field';
    const staticRowLabels = (customPropertyValueByKey.staticRowLabels || '').split(';').map(l => l.trim()).filter(Boolean);
    const staticColLabels = (customPropertyValueByKey.staticColLabels || '').split(';').map(l => l.trim()).filter(Boolean);
    const topics = useMemo(() => {
        if (labelSource === 'static') {
            return staticRowLabels;
        }
        const topicSet = new Set();
        records.forEach(record => {
            const vals = record.getCellValue(rowGroupField.id) || [];
            vals.forEach(val => {
                if (val && val.value && val.value.name) topicSet.add(val.value.name);
            });
        });
        return Array.from(topicSet).sort();
    }, [labelSource, staticRowLabels, records, rowGroupField]);
    const domains = useMemo(() => {
        if (labelSource === 'static') {
            return staticColLabels;
        }
        const domainSet = new Set();
        records.forEach(record => {
            const vals = record.getCellValue(columnGroupField.id) || [];
            vals.forEach(val => {
                if (val && val.value && val.value.name) domainSet.add(val.value.name);
            });
        });
        return Array.from(domainSet).sort();
    }, [labelSource, staticColLabels, records, columnGroupField]);
    // Matrix: topicName -> domainName -> [records]
    const matrix = useMemo(() => {
        const m = {};
        topics.forEach(topic => {
            m[topic] = {};
            domains.forEach(domain => {
                m[topic][domain] = [];
            });
        });
        if (labelSource === 'static') {
            // For static labels, only fill cells if a record matches both static label
            records.forEach(record => {
                const topicVals = record.getCellValue(rowGroupField.id) || [];
                const domainVals = record.getCellValue(columnGroupField.id) || [];
                const topicNames = topicVals.map(v => v && v.value && v.value.name).filter(Boolean);
                const domainNames = domainVals.map(v => v && v.value && v.value.name).filter(Boolean);
                topics.forEach(topic => {
                    domains.forEach(domain => {
                        if (topicNames.includes(topic) && domainNames.includes(domain)) {
                            m[topic][domain].push(record);
                        }
                    });
                });
            });
        } else {
            // Default behavior
            records.forEach(record => {
                const topicVals = record.getCellValue(rowGroupField.id) || [];
                const domainVals = record.getCellValue(columnGroupField.id) || [];
                const topicNames = topicVals.map(v => v && v.value && v.value.name).filter(Boolean);
                const domainNames = domainVals.map(v => v && v.value && v.value.name).filter(Boolean);
                topicNames.forEach(topic => {
                    domainNames.forEach(domain => {
                        if (m[topic] && m[topic][domain]) {
                            m[topic][domain].push(record);
                        }
                    });
                });
            });
        }
        // Sort each cell by Date descending
        topics.forEach(topic => {
            domains.forEach(domain => {
                m[topic][domain].sort((a, b) => {
                    const dA = a.getCellValue(primaryField.id);
                    const dB = b.getCellValue(primaryField.id);
                    return (dB ? new Date(dB) : 0) - (dA ? new Date(dA) : 0);
                });
            });
        });
        return m;
    }, [records, topics, domains, rowGroupField, columnGroupField, primaryField, labelSource]);
    // Modal state
    const [modalState, setModalState] = useState({open: false, topic: null, domain: null});
    const colorScheme = useColorScheme();
    const [hoveredDomain, setHoveredDomain] = useState(null);
    // Debug: Show records, topics, domains, and first 3 topic/domain field values
    const debugFirstVals = records.slice(0, 3).map((rec, i) => {
        const topicVal = rec.getCellValue(rowGroupField.id);
        const domainVal = rec.getCellValue(columnGroupField.id);
        return `#${i+1} Topic: ${JSON.stringify(topicVal)}, Domain: ${JSON.stringify(domainVal)}`;
    }).join('\n');
    const debugMatrix = (
        <div style={{margin:'16px 0', padding:'8px', background:'#fffbe6', border:'1px solid #ffe58f', borderRadius:8, color:'#ad6800', fontSize:'0.95em'}}>
            <div><b>Records:</b> {records.length}</div>
            <div><b>Topics:</b> {JSON.stringify(topics)}</div>
            <div><b>Domains:</b> {JSON.stringify(domains)}</div>
            <div style={{marginTop:8}}><b>First 3 Topic/Domain values:</b><br/><pre>{debugFirstVals}</pre></div>
        </div>
    );
    // User override for cell layout
    const [userLayout, setUserLayout] = useState(null); // {rows, cols} or null
    const [settingsOpen, setSettingsOpen] = useState(false);
    // Initialize settings with default card color if available
    const [settings, setSettings] = useState(() => {
        const defaultCardColor = customPropertyValueByKey.cardColor;
        const defaultColorSource = defaultCardColor?.id || null;
        
        return { 
            rows: 2, 
            cols: 3, 
            useCardColor: true,
            colorSource: defaultColorSource,
            showLegend: true
        };
    });
  
    // Get all single select fields for color source
    const colorFields = useMemo(() => {
        if (!table) return [];
        return table.fields.filter(field => field.type === FieldType.SINGLE_SELECT);
    }, [table]);

    // Update settings when custom properties change
    useEffect(() => {
        const defaultCardColor = customPropertyValueByKey.cardColor;
        const defaultColorSource = defaultCardColor?.id || null;
        
        setSettings(prev => ({
            ...prev,
            colorSource: prev.colorSource === null ? defaultColorSource : prev.colorSource
        }));
    }, [customPropertyValueByKey.cardColor]);

    // Render matrix
    return (
        <div className="rb-matrix-root" style={{minHeight: '100vh', fontFamily: 'Inter, Arial, sans-serif', padding: '16px'}}>
            {/* Header with actions */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="airtable-button"
                style={{
                  height: 32,
                  width: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: '1.4em',
                  border: '1px solid #e7e7e7',
                  borderRadius: 8,
                  background: '#fafbfc',
                  color: '#313131',
                  boxShadow: 'none',
                  outline: 'none',
                  fontFamily: 'Inter, Arial, sans-serif',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                aria-label="Settings"
                title="Settings"
                onClick={() => setSettingsOpen(v => !v)}
              >
                <GearIcon size={22} weight="regular" />
              </button>
              {settings.showLegend && (settings.colorSource || cardColor) && (
                <div className="rb-legend">
                  <span className="rb-legend-title">Legend:</span>
                  <span className="rb-legend-field">
                    {settings.colorSource 
                      ? colorFields.find(f => f.id === settings.colorSource)?.name 
                      : cardColor?.name}
                  </span>
                  {(settings.colorSource 
                    ? colorFields.find(f => f.id === settings.colorSource)?.options?.choices 
                    : cardColor?.options?.choices || []
                  ).map(choice => (
                    <span key={choice.id} className="rb-legend-choice">
                      <span
                        className="rb-legend-swatch"
                        style={{
                          background: choice.color 
                            ? `${require('@airtable/blocks/interface/ui').colorUtils.getHexForColor(choice.color)}80` 
                            : '#ccc'
                        }}
                      />
                      <span className="rb-legend-label">{choice.name}</span>
                    </span>
                  ))}
                </div>
              )}
                    </div>
                    <button
                        className="airtable-button"
                        style={{
                            height: 32,
                            width: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            fontSize: '1.4em',
                            border: '1px solid #e7e7e7',
                            borderRadius: 8,
                            background: '#fafbfc',
                            color: '#313131',
                            boxShadow: 'none',
                            outline: 'none',
                            fontFamily: 'Inter, Arial, sans-serif',
                            cursor: 'pointer',
                            transition: 'background 0.15s, border-color 0.15s',
                        }}
                        aria-label="Download"
                        title="Download as image"
                        onClick={handlePrint}
                    >
                        <Download size={22} weight="regular" />
                    </button>
                </div>
                
                {settingsOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        marginTop: '8px'
                    }}>
                        <SettingsMenu
                            open={settingsOpen}
                            onClose={() => setSettingsOpen(false)}
                            value={settings}
                            onChange={setSettings}
                            availableColorFields={colorFields}
                        />
                    </div>
                )}
            </div>
            
            <div className="bg-gray-gray50" style={{width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '16px'}}>
                              <div className="rb-matrix-header flex w-full">
                    <div 
                        className="px-2 py-1 border-r bg-gray-gray100 text-gray-gray900 font-semibold text-xs whitespace-normal break-words"
                        style={{
                            minWidth: topicColWidth,
                            flexBasis: topicColWidth,
                            flexGrow: 0,
                            flexShrink: 0,
                            borderRight: hoveredTopicCol ? '2px solid #888' : '1px solid #d1d5db',
                            transition: 'border-color 0.14s',
                            position: 'relative',
                            cursor: hoveredTopicCol ? 'col-resize' : 'default',
                        }}
                        onMouseEnter={() => setHoveredTopicCol(true)}
                        onMouseLeave={() => setHoveredTopicCol(false)}
                        onMouseDown={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (e.clientX >= rect.right - 8 && e.clientX <= rect.right + 4) {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startWidth = topicColWidth;
                                function onMouseMove(ev) {
                                    const delta = ev.clientX - startX;
                                    let newWidth = Math.max(60, Math.min(320, startWidth + delta));
                                    setTopicColWidth(newWidth);
                                }
                                function onMouseUp() {
                                    window.removeEventListener('mousemove', onMouseMove);
                                    window.removeEventListener('mouseup', onMouseUp);
                                }
                                window.addEventListener('mousemove', onMouseMove);
                                window.addEventListener('mouseup', onMouseUp);
                            }
                        }}
                    >
                        &nbsp;
                    </div>
                    {domains.map((domain, idx) => (
                        <div 
                            key={domain} 
                            className={`rb-matrix-column-header flex-1 min-w-[96px] px-2 py-1 ${idx < domains.length - 1 ? 'border-r border-gray-gray200' : ''} bg-gray-gray100 text-gray-gray900 font-semibold text-xs`} 
                            style={{ fontSize: '1.25rem' }}
                        >
                            {domain}
                        </div>
                    ))}
                </div>
                
                <div className="rb-matrix-body">
                    {topics.map(topic => (
                        <div
                            key={topic}
                            className="flex w-full border-b border-gray-gray200 bg-white hover:bg-gray-gray50 group"
                            aria-label={`Topic row: ${topic}`}
                            tabIndex={0}
                        >
                            <div
                                className="px-2 py-1 border-r bg-gray-gray100 text-gray-gray900 font-semibold text-xs whitespace-normal break-words"
                                style={{
                                    minWidth: topicColWidth,
                                    flexBasis: topicColWidth,
                                    flexGrow: 0,
                                    flexShrink: 0,
                                    borderRight: hoveredTopicCol ? '2px solid #888' : '1px solid #d1d5db',
                                    transition: 'border-color 0.14s',
                                    position: 'relative',
                                    cursor: hoveredTopicCol ? 'col-resize' : 'default',
                                    fontSize: '1.25rem',
                                }}
                                onMouseEnter={() => setHoveredTopicCol(true)}
                                onMouseLeave={() => setHoveredTopicCol(false)}
                                onMouseDown={e => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    if (e.clientX >= rect.right - 8 && e.clientX <= rect.right + 4) {
                                        e.preventDefault();
                                        const startX = e.clientX;
                                        const startWidth = topicColWidth;
                                        function onMouseMove(ev) {
                                            const delta = ev.clientX - startX;
                                            let newWidth = Math.max(60, Math.min(320, startWidth + delta));
                                            setTopicColWidth(newWidth);
                                        }
                                        function onMouseUp() {
                                            window.removeEventListener('mousemove', onMouseMove);
                                            window.removeEventListener('mouseup', onMouseUp);
                                        }
                                        window.addEventListener('mousemove', onMouseMove);
                                        window.addEventListener('mouseup', onMouseUp);
                                    }
                                }}
                            >
                                {topic}
                            </div>
                            {domains.map((domain, idx) => (
                                <div
                                    key={domain}
                                    className={`flex-1 min-w-[96px] px-2 py-1 text-gray-gray900 text-xs truncate ${idx < domains.length - 1 ? 'border-r border-gray-gray200' : ''}`}
                                >
                                    <MatrixCell
                                        records={matrix[topic][domain]}
                                        primaryField={primaryField}
                                        imageField={imageField}
                                        cardColor={cardColor}
                                        cellRowCount={settings.rows}
                                        cellColCount={settings.cols}
                                        useCardColor={settings.useCardColor}
                                        colorSourceField={settings.colorSource ? 
                                            table.getFieldByIdIfExists(settings.colorSource) : null}
                                        onPlusClick={() => setModalState({open: true, topic, domain})}
                                        expandRecord={expandRecord}
                                        table={table}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            {modalState.open && (
                <MatrixModal
                    records={matrix[modalState.topic]?.[modalState.domain] || []}
                    rowGroup={modalState.topic}
                    columnGroup={modalState.domain}
                    onClose={() => setModalState({open: false, topic: null, domain: null})}
                    primaryField={primaryField}
                    imageField={imageField}
                    expandRecord={expandRecord}
                    table={table}
                />
            )}
        </div>
    );
}

// Matrix cell: 3x2 grid, shows up to 6 records, + indicator for overflow
import { colorUtils } from '@airtable/blocks/interface/ui';

function MatrixCell({records, primaryField, imageField, cardColor, useCardColor = true, colorSourceField, cellRowCount, cellColCount, onPlusClick, expandRecord, table}) {
    const maxDisplay = cellRowCount * cellColCount;
    const displayRecords = records.slice(0, maxDisplay);
    const overflow = records.length > maxDisplay;
    const gridStyle = {
        display: 'grid',
        gridTemplateRows: `repeat(${cellRowCount}, 1fr)`,
        gridTemplateColumns: `repeat(${cellColCount}, 1fr)`
    };
    return (
        <div className="rb-cell-grid" style={gridStyle}>
            {(() => {
                const cards = [];
                const lastIdx = overflow ? maxDisplay - 1 : Math.min(records.length, maxDisplay) - 1;
                for (let idx = 0; idx <= lastIdx; idx++) {
                    if (overflow && idx === maxDisplay - 1) {
                        cards.push(
                            <div key="rb-cell-plus" className="rb-cell-record rb-cell-plus" onClick={onPlusClick}>
                                <span className="rb-cell-plus-number">+{records.length - (maxDisplay - 1)}</span>
                            </div>
                        );
                        break;
                    }
                    const record = records[idx];
                    if (!record) break;
                    let cardBg = undefined;
                    if (useCardColor && colorSourceField) {
                        // Use the selected color source field
                        const colorValue = record.getCellValue(colorSourceField.id);
                        if (colorValue && colorValue.color) {
                            const hex = colorUtils.getHexForColor(colorValue.color);
                            cardBg = hex ? `${hex}80` : undefined; // 80 = 50% opacity
                        }
                    } else if (useCardColor && cardColor) {
                        // Fallback to the original cardColor if no specific source is selected
                        const colorValue = record.getCellValue(cardColor.id);
                        if (colorValue && colorValue.color) {
                            const hex = colorUtils.getHexForColor(colorValue.color);
                            cardBg = hex ? `${hex}80` : undefined; // 80 = 50% opacity
                        }
                    }
                    cards.push(
                        <div key={record.id} className="rb-cell-record" style={cardBg ? { backgroundColor: cardBg } : {}} onClick={() => {
                            if (table && table.hasPermissionToExpandRecords()) expandRecord(record);
                        }}>
                            <CellThumb record={record} imageField={imageField} />
                            <div className="rb-cell-title">{record.getCellValueAsString(primaryField.id)}</div>
                        </div>
                    );
                }
                return cards;
            })()}

        </div>
    );
}

// Modal for overflow records
function MatrixModal({records, rowGroup, columnGroup, onClose, primaryField, imageField, expandRecord, table}) {
    return (
        <div className="rb-modal-overlay">
            <div className="rb-modal-box">
                <div className="rb-modal-header">
                    <span>Records for <b>{rowGroup}</b> × <b>{columnGroup}</b></span>
                    <button className="rb-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rb-modal-list">
                    {records.map(record => (
                        <div 
                            key={record.id} 
                            className="rb-modal-record" 
                            onClick={() => {
                                if (table && table.hasPermissionToExpandRecords()) expandRecord(record);
                            }}
                        >
                            <CellThumb record={record} imageField={imageField} />
                            <span className="rb-modal-title">
                                {record.getCellValueAsString(primaryField.id)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Thumbnail for a record
function CellThumb({record, imageField, small}) {
    if (!imageField) {
        return <div className={small ? 'rb-thumb-small rb-thumb-placeholder' : 'rb-thumb rb-thumb-placeholder'} />;
    }
    const attachments = record.getCellValue(imageField.id) || [];
    const thumbUrl = attachments[0]?.url;
    return thumbUrl ? (
        <img src={thumbUrl} alt="thumb" className={small ? 'rb-thumb-small' : 'rb-thumb'} />
    ) : (
        <div className={small ? 'rb-thumb-small rb-thumb-placeholder' : 'rb-thumb rb-thumb-placeholder'} />
    );
}


initializeBlock({interface: () => <RedBullMatrixApp />});
