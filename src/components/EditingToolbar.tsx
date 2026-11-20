import React from 'react';
import {
  Captions,
  Combine,
  Gauge,
  Music,
  Palette,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Type,
} from 'lucide-react';
import { ToolTabId } from '../types/editor';
import { PWAInstallButton } from './PWAInstallButton';

interface EditingToolbarProps {
  activeTool: ToolTabId;
  onSelectTool: (tool: ToolTabId) => void;
}

const TOOL_ITEMS: {
  id: ToolTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  { id: 'cut_trim', label: 'Cut & Trim', icon: Scissors, accentColor: '#10B981' },
  { id: 'split_merge', label: 'Split & Merge', icon: Combine, accentColor: '#FF6B2C' },
  { id: 'transitions', label: 'Transitions', icon: Sparkles, accentColor: '#FF2E93' },
  { id: 'filters', label: 'Filters & Effects', icon: Palette, accentColor: '#FF2E93' },
  { id: 'text_stickers', label: 'Text & Stickers', icon: Type, accentColor: '#10B981' },
  { id: 'music_audio', label: 'Music & Audio', icon: Music, accentColor: '#10B981' },
  { id: 'auto_captions', label: 'Auto Captions', icon: Captions, accentColor: '#FF6B2C' },
  { id: 'speed', label: 'Speed Control', icon: Gauge, accentColor: '#10B981' },
  { id: 'color_grading', label: 'Color Grading', icon: SlidersHorizontal, accentColor: '#FF6B2C' },
];

export const EditingToolbar: React.FC<EditingToolbarProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <div className="bg-[#101218] border border-white/10 rounded-xl p-2 flex items-center justify-between gap-2 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        {TOOL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTool(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#171A23] text-white border border-white/15'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span style={{ color: isActive ? item.accentColor : undefined }}>
                <Icon className="w-4 h-4" />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <PWAInstallButton />
    </div>
  );
};
