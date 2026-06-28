/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';

interface ColorPickerProps {
  color: string; // hex color e.g., "#2563eb"
  onChange: (hex: string) => void;
}

// Color conversion helpers
function hexToRgb(hex: string) {
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length !== 6) {
    return { r: 37, g: 99, b: 235 };
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (c: number) => {
    const val = Math.max(0, Math.min(255, Math.round(c)));
    const h = val.toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number) {
  h /= 360;
  s /= 100;
  v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svPanelRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  // Parse initial color
  const rgbInit = hexToRgb(color);
  const hsvInit = rgbToHsv(rgbInit.r, rgbInit.g, rgbInit.b);

  const [hsv, setHsv] = useState(hsvInit);
  const [rgb, setRgb] = useState(rgbInit);
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  
  // Format mode: 'rgb' or 'hex'
  const [formatMode, setFormatMode] = useState<'rgb' | 'hex'>('rgb');

  // Keep state synced with outer color prop when picker is closed
  useEffect(() => {
    if (!showPicker) {
      const parsedRgb = hexToRgb(color);
      setRgb(parsedRgb);
      setHsv(rgbToHsv(parsedRgb.r, parsedRgb.g, parsedRgb.b));
      setHexInput(color.toUpperCase());
    }
  }, [color, showPicker]);

  // Click outside to close picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update SV from panel drag
  const updateSV = (clientX: number, clientY: number) => {
    if (!svPanelRef.current) return;
    const rect = svPanelRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    
    const s = (x / rect.width) * 100;
    const v = (1 - y / rect.height) * 100;

    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);

    const newRgb = hsvToRgb(newHsv.h, s, v);
    setRgb(newRgb);

    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(newHex);
    onChange(newHex);
  };

  // Update Hue from slider drag
  const updateHue = (clientX: number) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    
    const h = (x / rect.width) * 360;

    const newHsv = { ...hsv, h };
    setHsv(newHsv);

    const newRgb = hsvToRgb(h, hsv.s, hsv.v);
    setRgb(newRgb);

    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(newHex);
    onChange(newHex);
  };

  // Drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSV) {
        updateSV(e.clientX, e.clientY);
      } else if (isDraggingHue) {
        updateHue(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSV(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSV || isDraggingHue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSV, isDraggingHue, hsv]);

  // Handle RGB inputs change
  const handleRgbChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    const val = Math.max(0, Math.min(255, parseInt(valStr) || 0));
    const newRgb = { ...rgb, [channel]: val };
    setRgb(newRgb);

    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    setHsv(newHsv);

    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(newHex);
    onChange(newHex);
  };

  // Handle Hex input change
  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    const cleanHex = val.trim();
    if (cleanHex.startsWith('#') ? cleanHex.length === 7 : cleanHex.length === 6) {
      const formattedHex = cleanHex.startsWith('#') ? cleanHex : `#${cleanHex}`;
      const newRgb = hexToRgb(formattedHex);
      setRgb(newRgb);
      setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
      onChange(formattedHex.toUpperCase());
    }
  };

  // EyeDropper API (modern browser color-picker tool)
  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const selectedColor = result.sRGBHex.toUpperCase();
          const newRgb = hexToRgb(selectedColor);
          setRgb(newRgb);
          setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
          setHexInput(selectedColor);
          onChange(selectedColor);
        }
      } catch (err) {
        console.warn("EyeDropper was canceled or failed:", err);
      }
    } else {
      alert("EyeDropper API is not supported in this browser. Please type or drag to select a color.");
    }
  };

  // Render format inputs based on current formatMode ('rgb' or 'hex')
  const renderInputs = () => {
    if (formatMode === 'rgb') {
      return (
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 flex flex-col items-center">
            <input
              type="number"
              value={rgb.r}
              min="0"
              max="255"
              onChange={(e) => handleRgbChange('r', e.target.value)}
              className="w-full text-center border border-slate-200 dark:border-slate-700/60 rounded-md p-1.5 text-[13px] font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">R</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <input
              type="number"
              value={rgb.g}
              min="0"
              max="255"
              onChange={(e) => handleRgbChange('g', e.target.value)}
              className="w-full text-center border border-slate-200 dark:border-slate-700/60 rounded-md p-1.5 text-[13px] font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">G</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <input
              type="number"
              value={rgb.b}
              min="0"
              max="255"
              onChange={(e) => handleRgbChange('b', e.target.value)}
              className="w-full text-center border border-slate-200 dark:border-slate-700/60 rounded-md p-1.5 text-[13px] font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">B</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            className="w-full text-center border border-slate-200 dark:border-slate-700/60 rounded-md p-1.5 text-[13px] font-mono font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none focus:border-indigo-500"
            placeholder="#FFFFFF"
          />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">HEX</span>
        </div>
      );
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Small Outer Preview trigger button that replicates the user row */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-10 h-7 rounded-md border border-slate-250 dark:border-slate-700 cursor-pointer shadow-xs relative overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          style={{ backgroundColor: color }}
        />
        <span 
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer uppercase select-none transition-colors"
        >
          {color}
        </span>
      </div>

      {/* Popover Card */}
      {showPicker && (
        <div 
          className="absolute left-0 mt-2.5 z-50 bg-white dark:bg-[#0c142c] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] flex flex-col gap-3.5 select-none w-[260px] animate-fade-in"
          style={{ contentVisibility: 'auto' }}
        >
          {/* Saturation / Value Area */}
          <div
            ref={svPanelRef}
            onMouseDown={(e) => {
              setIsDraggingSV(true);
              updateSV(e.clientX, e.clientY);
            }}
            className="w-full h-[150px] rounded-lg relative cursor-crosshair overflow-hidden"
            style={{
              backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
              backgroundImage: `
                linear-gradient(to right, #fff, transparent),
                linear-gradient(to bottom, transparent, #000)
              `
            }}
          >
            {/* SV Drag Circle Handle */}
            <div
              className="w-5.5 h-5.5 rounded-full border-[3px] border-white shadow-md absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: color
              }}
            />
          </div>

          {/* Slider & Actions Row */}
          <div className="flex items-center gap-3">
            {/* Eyedropper Icon trigger */}
            <button
              type="button"
              onClick={handleEyeDropper}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="EyeDropper Tool"
            >
              <Eye className="w-4.5 h-4.5" />
            </button>

            {/* Circular Active Preview */}
            <div
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700/80 shrink-0 shadow-xs"
              style={{ backgroundColor: color }}
            />

            {/* Hue Spectrum Slider */}
            <div
              ref={hueSliderRef}
              onMouseDown={(e) => {
                setIsDraggingHue(true);
                updateHue(e.clientX);
              }}
              className="flex-1 h-3 rounded-full relative cursor-ew-resize"
              style={{
                background: 'linear-gradient(to right, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff7f00, #ff0000, #ff00ff)'
              }}
            >
              {/* Hue slider handle */}
              <div
                className="w-4.5 h-4.5 rounded-full border-2 border-white shadow-xs absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  left: `${(hsv.h / 360) * 100}%`,
                  backgroundColor: `hsl(${hsv.h}, 100%, 50%)`
                }}
              />
            </div>
          </div>

          {/* RGB/Hex Inputs Row */}
          <div className="flex items-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            {/* The format inputs */}
            {renderInputs()}

            {/* Selector toggle button to switch format */}
            <button
              type="button"
              onClick={() => setFormatMode(formatMode === 'rgb' ? 'hex' : 'rgb')}
              className="p-1 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 shrink-0 cursor-pointer flex flex-col items-center justify-center h-8"
              title="Toggle HEX/RGB format"
            >
              <ChevronUp className="w-3.5 h-2 -mb-0.5" />
              <ChevronDown className="w-3.5 h-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
