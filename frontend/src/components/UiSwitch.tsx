import React from 'react';
import { Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface UiSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
  badge?: string;
}

export const UiSwitch: React.FC<UiSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
  badge,
}) => {
  const { designStyle, activeDesign } = useTheme();

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  // Render toggle switch knob and track depending on selected mobile skin
  const renderSwitchTrack = () => {
    if (designStyle === 'material') {
      // Google Material 3 Expressive Switch (pill track, enlarged thumb with check icon when checked)
      return (
        <div
          className={`relative inline-flex items-center h-7 w-13 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out select-none ${
            checked
              ? 'bg-[#7c3aed] border border-[#7c3aed]'
              : 'bg-zinc-200 dark:bg-zinc-700 border-2 border-zinc-400 dark:border-zinc-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 ease-in-out ${
              checked
                ? 'w-5.5 h-5.5 translate-x-6 text-[#7c3aed]'
                : 'w-4 h-4 translate-x-1 bg-zinc-500 dark:bg-zinc-400'
            }`}
          >
            {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
        </div>
      );
    }

    if (designStyle === 'oneui') {
      // Samsung One UI 6/7 Switch (smooth rounded squircle oval, clean white knob, vibrant royal blue)
      return (
        <div
          className={`relative inline-flex items-center h-6.5 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out select-none ${
            checked ? 'bg-[#2563eb]' : 'bg-zinc-300 dark:bg-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
              checked ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </div>
      );
    }

    if (designStyle === 'oxygen') {
      // OnePlus OxygenOS Aquamorphic Switch (sleek technical pill track with Never Settle crimson glow & center dot)
      return (
        <div
          className={`relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-150 ease-out select-none ${
            checked
              ? 'bg-[#eb0028] shadow-[0_0_12px_rgba(235,0,40,0.5)]'
              : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-400/40 dark:border-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out ${
              checked ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          >
            {checked && <span className="w-1.5 h-1.5 rounded-full bg-[#eb0028]" />}
          </span>
        </div>
      );
    }

    // Default / fallback for other themes (classic, nordic, cyber, glass, sunset)
    return (
      <div
        style={{
          backgroundColor: checked ? activeDesign.primaryColor : undefined,
        }}
        className={`relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out select-none ${
          !checked ? 'bg-zinc-300 dark:bg-zinc-700' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </div>
    );
  };

  if (!label && !description) {
    return (
      <div
        id={id}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 ${className}`}
      >
        {renderSwitchTrack()}
      </div>
    );
  }

  return (
    <div
      id={id}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 ${
        checked
          ? 'border-orange-400/40 bg-orange-50/50 dark:bg-orange-950/20'
          : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-850/40 hover:border-zinc-300 dark:hover:border-zinc-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="flex-1 pr-2">
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {label}
            </span>
          )}
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div>{renderSwitchTrack()}</div>
    </div>
  );
};
