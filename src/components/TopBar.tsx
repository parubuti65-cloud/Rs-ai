import React from 'react';
import { Download } from 'lucide-react';
import { WorkspaceView } from '../types/editor';

interface TopBarProps {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  onOpenExport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onChangeView,
  onOpenExport,
}) => {
  const navItems: { id: WorkspaceView; label: string }[] = [
    { id: 'studio', label: 'Video Studio' },
    { id: 'android_project', label: 'Android Project' },
    { id: 'architecture', label: 'Tech & Branding' },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#101218]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Single-line Brand Title */}
      <button
        type="button"
        onClick={() => onChangeView('studio')}
        className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F3F4F6] whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] rounded"
      >
        <span className="text-[#10B981]">RS</span>
        <span>AI VIDEO EDITOR PRO</span>
      </button>

      {/* Zone 2: Clean single-line navigation links */}
      <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`relative py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-white ${
                isActive
                  ? 'text-white'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10B981]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Single Primary Action CTA */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B2C] hover:bg-[#ff7d45] active:scale-[0.98] text-[#08090C] text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B2C]/70"
        >
          <Download className="w-4 h-4" />
          <span>Export 4K</span>
        </button>
      </div>
    </header>
  );
};
