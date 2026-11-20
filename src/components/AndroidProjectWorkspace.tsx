import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  FolderOpen,
  Search,
} from 'lucide-react';
import {
  ANDROID_PROJECT_FILES,
  ANDROID_PROJECT_NAME,
} from '../data/androidProjectFiles';
import { AndroidProjectFile } from '../types/editor';
import { PWAInstallButton } from './PWAInstallButton';

type CategoryFilter = 'All' | AndroidProjectFile['category'];

const CATEGORIES: CategoryFilter[] = [
  'All',
  'Gradle & Build',
  'Manifest & Resources',
  'Theme & Branding',
  'Domain & Engine',
  'Compose UI',
];

export const AndroidProjectWorkspace: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>(
    'app/src/main/java/com/rs/aivideoeditorpro/ui/screens/VideoEditorScreen.kt'
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const filteredFiles = useMemo(() => {
    return ANDROID_PROJECT_FILES.filter((file) => {
      const matchesCategory =
        categoryFilter === 'All' || file.category === categoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  const activeFile =
    ANDROID_PROJECT_FILES.find((f) => f.path === selectedPath) ??
    filteredFiles[0] ??
    ANDROID_PROJECT_FILES[0];

  const handleCopyFile = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopiedPath(activeFile.path);
    setTimeout(() => setCopiedPath(null), 1800);
  };

  const handleDownloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder(ANDROID_PROJECT_NAME);
      if (rootFolder) {
        ANDROID_PROJECT_FILES.forEach((file) => {
          rootFolder.file(file.path, file.content);
        });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ANDROID_PROJECT_NAME}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  const lines = activeFile ? activeFile.content.split('\n') : [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 flex flex-col gap-5">
      {/* Project Header Banner */}
      <div className="bg-[#101218] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#10B981] font-medium">
            <FolderOpen className="w-4 h-4" />
            <span>Single Unified Android Studio Project</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-[#9CA3AF]">
              {ANDROID_PROJECT_FILES.length} files
            </span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
            {ANDROID_PROJECT_NAME}
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
            Complete Kotlin, Jetpack Compose, FFmpegKit, and Android Media3 project packaged into one Gradle module with GitHub Actions APK compilation included.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={handleDownloadProjectZip}
            disabled={isZipping}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-[#08090C] text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Packaging ZIP...' : 'Download Project (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* APK Build Guide Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#101218] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-[#10B981]">01. Android Studio Local APK</div>
          <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
            Extract the ZIP, open in Android Studio, wait for Gradle sync, then choose Build → Build Bundle(s) / APK(s) → Build APK(s).
          </p>
        </div>
        <div className="bg-[#101218] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-[#FF2E93]">02. GitHub Cloud APK (No PC Setup)</div>
          <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
            Push the extracted folder to GitHub; the included <span className="font-mono-tabular text-white">.github/workflows/build-apk.yml</span> compiles <span className="font-mono-tabular text-white">app-debug.apk</span> automatically.
          </p>
        </div>
        <div className="bg-[#101218] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-[#FF6B2C]">03. Instant Android Install (PWA)</div>
          <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
            Open this app in Chrome on Android and tap Add to Home Screen (or Install on Android) for immediate standalone mobile access.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#101218] p-1 rounded-xl border border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#171A23] text-[#10B981]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter Kotlin / Gradle files..."
            className="w-full bg-[#101218] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
          />
        </div>
      </div>

      {/* Two-Column Project Explorer & Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left File Tree */}
        <div className="lg:col-span-4 bg-[#101218] border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[640px]">
          <div className="px-4 py-3 border-b border-white/10 text-xs font-medium text-[#9CA3AF] flex items-center justify-between">
            <span>Project Structure</span>
            <span className="font-mono-tabular">{filteredFiles.length} items</span>
          </div>
          <div className="overflow-y-auto divide-y divide-white/5">
            {filteredFiles.map((file) => {
              const active = activeFile?.path === file.path;
              const fileName = file.path.split('/').pop() ?? file.path;
              const dirPath = file.path.slice(0, Math.max(0, file.path.length - fileName.length));
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 cursor-pointer ${
                    active ? 'bg-[#171A23]' : 'hover:bg-white/5'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      active
                        ? 'text-[#10B981]'
                        : file.language === 'kotlin'
                        ? 'text-[#FF2E93]'
                        : 'text-[#FF6B2C]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#F3F4F6] truncate">
                      {fileName}
                    </div>
                    {dirPath && (
                      <div className="font-mono-tabular text-[10px] text-[#6B7280] truncate">
                        {dirPath}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Inspector */}
        <div className="lg:col-span-8 bg-[#101218] border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[640px]">
          {activeFile && (
            <>
              <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#101218]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span className="font-mono-tabular text-xs font-semibold text-white truncate">
                      {activeFile.path}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">
                    {activeFile.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] cursor-pointer shrink-0"
                >
                  {copiedPath === activeFile.path ? (
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  )}
                  <span>{copiedPath === activeFile.path ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="overflow-auto bg-[#08090C] p-4 flex-1">
                <table className="w-full border-collapse font-mono-tabular text-[12px] leading-relaxed">
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03]">
                        <td className="select-none pr-4 text-right text-[#4B5563] w-10 align-top">
                          {idx + 1}
                        </td>
                        <td className="text-[#E5E7EB] whitespace-pre">{line || ' '}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
