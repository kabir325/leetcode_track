import React, { useState, useRef, useEffect } from 'react';
import { GroupMember } from '../types.ts';
import {
  Code2,
  PlusCircle,
  User,
  Users,
  Calendar,
  Sparkles,
  Settings,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface NavbarProps {
  currentMember: GroupMember | null;
  members: GroupMember[];
  onOpenPostModal: () => void;
  onOpenProfileModal: () => void;
  onOpenSwitchModal: () => void;
  selectedDateStr: string;
  onSelectToday: () => void;
  onResetData?: () => void;
  onClearAll?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMember,
  members,
  onOpenPostModal,
  onOpenProfileModal,
  onOpenSwitchModal,
  selectedDateStr,
  onSelectToday,
  onResetData,
  onClearAll,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    }
    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-xs">
              <Code2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-slate-900 tracking-tight text-lg">
                  LeetCode Group Tracker
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  AI Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Daily collaborative practice & complexity insights for friends
              </p>
            </div>
          </div>

          {/* Center / Date shortcut */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Viewing: <strong className="text-slate-900">{selectedDateStr}</strong></span>
            <button
              id="navbar-today-btn"
              onClick={onSelectToday}
              className="ml-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Go to Today
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            {/* Post question button */}
            <button
              id="navbar-post-question-btn"
              onClick={onOpenPostModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Post Question</span>
            </button>

            {/* Profile / Switcher */}
            {currentMember ? (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
                <button
                  id="navbar-active-profile-btn"
                  onClick={onOpenProfileModal}
                  title="View My Profile & Submissions"
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer group"
                >
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentMember.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-white`}
                  >
                    {currentMember.avatarInitials}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {currentMember.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 leading-tight">
                      @{currentMember.handle}
                    </div>
                  </div>
                </button>

                <button
                  id="navbar-switch-user-btn"
                  onClick={onOpenSwitchModal}
                  title="Switch or Add Friends"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="navbar-login-select-btn"
                onClick={onOpenSwitchModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Select Profile</span>
              </button>
            )}

            {/* Manage & Data Options */}
            {(onResetData || onClearAll) && (
              <div className="relative" ref={menuRef}>
                <button
                  id="navbar-settings-btn"
                  type="button"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  title="Data & Storage Options"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                      Group Data & Reset
                    </div>

                    {onResetData && (
                      <button
                        id="menu-reset-sample-btn"
                        type="button"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onResetData();
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                        <span>Reset to Sample Problems</span>
                      </button>
                    )}

                    {onClearAll && (
                      <button
                        id="menu-clear-all-btn"
                        type="button"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onClearAll();
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All Practice Data</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
