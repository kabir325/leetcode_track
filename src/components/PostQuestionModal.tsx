import React, { useState } from 'react';
import { DailyQuestion, GroupMember } from '../types.ts';
import { postNewProblem, formatDateKey } from '../services/apiClient.ts';
import {
  X,
  PlusCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  Link2,
  Calendar,
  Zap,
} from 'lucide-react';

interface PostQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  currentMember: GroupMember | null;
  onQuestionAdded: (question: DailyQuestion) => void;
}

export const PostQuestionModal: React.FC<PostQuestionModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  currentMember,
  onQuestionAdded,
}) => {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(targetDate || formatDateKey(new Date()));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sample problems to quickly test
  const quickSamples = [
    { title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
    { title: 'Coin Change', url: 'https://leetcode.com/problems/coin-change/' },
    { title: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals/' },
    { title: 'Binary Tree Level Order Traversal', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError('Please paste a LeetCode problem link or problem title.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep('Connecting to AI Problem Analyzer...');

    try {
      setTimeout(() => {
        setLoadingStep('Extracting statement, examples & constraints...');
      }, 1200);

      setTimeout(() => {
        setLoadingStep('Synthesizing interview use cases & target complexity...');
      }, 2400);

      const result = await postNewProblem({
        input: inputUrl.trim(),
        targetDate: selectedDate,
        postedByUserId: currentMember?.id || 'user-1',
        postedByUserName: currentMember?.name || 'Group Member',
      });

      onQuestionAdded(result.question);
      setInputUrl('');
      onClose();
    } catch (err: any) {
      console.error('Error posting question:', err);
      setError(err.message || 'Failed to parse problem. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div
      id="post-question-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="post-question-modal-container"
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                Post Daily LeetCode Problem
              </h2>
              <p className="text-xs text-slate-500">
                Paste any problem link — AI will extract everything automatically
              </p>
            </div>
          </div>

          <button
            id="close-post-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Posting As */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Posting as:</span>
            {currentMember ? (
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-tr ${currentMember.avatarColor} flex items-center justify-center text-white font-bold text-[10px]`}
                >
                  {currentMember.avatarInitials}
                </div>
                <span className="text-xs font-bold text-slate-900">{currentMember.name}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-700 font-medium">Alex Chen (Default)</span>
            )}
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Assigned Practice Date
            </label>
            <input
              id="post-target-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* LeetCode URL / Title input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              LeetCode Problem Link or Name
            </label>
            <input
              id="leetcode-url-input"
              type="text"
              placeholder="https://leetcode.com/problems/longest-substring-without-repeating-characters/"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports full URL (e.g. leetcode.com/problems/...) or problem titles like "Coin Change".
            </p>
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              Quick Suggestions to Try:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSamples.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => setInputUrl(sample.url)}
                  className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 transition-colors cursor-pointer text-left"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-3">
            <button
              id="submit-post-question-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingStep || 'Analyzing problem with AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Analyze & Post to Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
