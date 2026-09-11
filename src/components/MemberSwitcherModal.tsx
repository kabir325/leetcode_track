import React, { useState } from 'react';
import { GroupMember } from '../types.ts';
import { createMember } from '../services/apiClient.ts';
import {
  X,
  Users,
  Check,
  Plus,
  UserPlus,
  LogOut,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface MemberSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  currentMember: GroupMember | null;
  onSelectMember: (member: GroupMember | null) => void;
  onMemberCreated: (member: GroupMember) => void;
}

export const MemberSwitcherModal: React.FC<MemberSwitcherModalProps> = ({
  isOpen,
  onClose,
  members,
  currentMember,
  onSelectMember,
  onMemberCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'create'>('switch');
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newBio, setNewBio] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-blue-500 to-indigo-600');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const colorOptions = [
    { label: 'Blue Indigo', class: 'from-blue-500 to-indigo-600' },
    { label: 'Emerald Teal', class: 'from-emerald-500 to-teal-600' },
    { label: 'Amber Orange', class: 'from-amber-500 to-orange-600' },
    { label: 'Rose Pink', class: 'from-rose-500 to-pink-600' },
    { label: 'Purple Violet', class: 'from-purple-500 to-violet-600' },
    { label: 'Cyan Sky', class: 'from-cyan-500 to-blue-600' },
  ];

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createMember({
        name: newName.trim(),
        handle: newHandle.trim(),
        bio: newBio.trim(),
        avatarColor: selectedGradient,
      });

      onMemberCreated(result.member);
      onSelectMember(result.member);
      setNewName('');
      setNewHandle('');
      setNewBio('');
      onClose();
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="member-switcher-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="member-switcher-modal-container"
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                Switch or Create Profile
              </h2>
              <p className="text-xs text-slate-500">
                Log into your account with 1 click
              </p>
            </div>
          </div>

          <button
            id="close-switcher-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3">
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 mr-6 transition-colors cursor-pointer ${
              activeTab === 'switch'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Select Friend ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add New Friend</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'switch' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {members.map((m) => {
                  const isSelected = currentMember?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      id={`select-member-btn-${m.id}`}
                      onClick={() => {
                        onSelectMember(m);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-tr ${m.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-xs`}
                        >
                          {m.avatarInitials}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {m.name}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            @{m.handle}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">
                          Select →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Leave / Log out */}
              {currentMember && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    id="leave-logout-btn"
                    onClick={() => {
                      onSelectMember(null);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Leave Active Session (Browse as Guest)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Create Profile Form */
            <form onSubmit={handleCreateMember} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Friend's Name *
                </label>
                <input
                  id="new-member-name-input"
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  LeetCode Handle / Username (Optional)
                </label>
                <input
                  id="new-member-handle-input"
                  type="text"
                  placeholder="e.g. mayalin_code"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Avatar Color Theme
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.class}
                      type="button"
                      onClick={() => setSelectedGradient(opt.class)}
                      className={`h-9 rounded-xl bg-gradient-to-tr ${opt.class} flex items-center justify-center text-white transition-transform cursor-pointer ${
                        selectedGradient === opt.class
                          ? 'ring-2 ring-slate-900 scale-105 shadow-xs'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedGradient === opt.class && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Short Goal / Bio (Optional)
                </label>
                <input
                  id="new-member-bio-input"
                  type="text"
                  placeholder="e.g. Practicing Trees & Graphs daily"
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  id="create-member-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create & Log In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
