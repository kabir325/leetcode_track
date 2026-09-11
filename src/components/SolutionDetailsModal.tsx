import React, { useState } from 'react';
import { QuestionSubmission, DailyQuestion } from '../types.ts';
import {
  X,
  ExternalLink,
  Cpu,
  HardDrive,
  Code2,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';

interface SolutionDetailsModalProps {
  submission: QuestionSubmission | null;
  question: DailyQuestion | null;
  onClose: () => void;
}

export const SolutionDetailsModal: React.FC<SolutionDetailsModalProps> = ({
  submission,
  question,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!submission) return null;

  const handleCopyCode = () => {
    if (submission.codeSnippet) {
      navigator.clipboard.writeText(submission.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      id="solution-details-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="solution-details-modal-container"
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-tr ${submission.userAvatarColor} flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 ring-2 ring-white`}
            >
              {submission.userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-display font-bold text-slate-900">
                  {submission.userName}'s Solution
                </h2>
                <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {submission.language}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>For: <strong>{question?.title || 'LeetCode Question'}</strong></span>
                {formattedDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            id="close-solution-details-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Complexity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Time Complexity
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mb-1">
                {submission.timeComplexity}
              </div>
              {submission.timeExplanation && (
                <p className="text-xs text-slate-600 leading-normal">
                  {submission.timeExplanation}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                Space Complexity
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mb-1">
                {submission.spaceComplexity}
              </div>
              {submission.spaceExplanation && (
                <p className="text-xs text-slate-600 leading-normal">
                  {submission.spaceExplanation}
                </p>
              )}
            </div>
          </div>

          {/* Approach & Metrics */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            {submission.approach && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Algorithmic Approach
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {submission.approach}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/80 text-xs">
              {submission.runtime && (
                <div>
                  <span className="text-slate-500">Runtime: </span>
                  <strong className="text-slate-900 font-mono">{submission.runtime}</strong>
                </div>
              )}
              {submission.memory && (
                <div>
                  <span className="text-slate-500">Memory: </span>
                  <strong className="text-slate-900 font-mono">{submission.memory}</strong>
                </div>
              )}
              <div>
                <span className="text-slate-500">Status: </span>
                <span className="text-emerald-700 font-bold">Accepted</span>
              </div>
            </div>
          </div>

          {/* Solution Code Snippet */}
          {submission.codeSnippet ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-600" />
                  Submitted Code ({submission.language})
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <pre>{submission.codeSnippet}</pre>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-center">
              Direct code snippet wasn't included with submission URL. Check LeetCode submission link below.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <a
            href={submission.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>View on LeetCode</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
