import React from 'react';
import { DailyQuestion } from '../types.ts';
import {
  X,
  ExternalLink,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Cpu,
  HardDrive,
  UploadCloud,
  AlertCircle,
} from 'lucide-react';

interface ProblemDetailsModalProps {
  question: DailyQuestion | null;
  onClose: () => void;
  onOpenSubmitModal: (question: DailyQuestion) => void;
}

export const ProblemDetailsModal: React.FC<ProblemDetailsModalProps> = ({
  question,
  onClose,
  onOpenSubmitModal,
}) => {
  if (!question) return null;

  const difficultyStyles = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Hard: 'bg-rose-50 text-rose-700 border-rose-200',
  }[question.difficulty] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div
      id="problem-details-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="problem-details-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {question.leetcodeNumber && (
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                  LeetCode #{question.leetcodeNumber}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                {question.title}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${difficultyStyles}`}>
                {question.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs"
                >
                  {tag}
                </span>
              ))}
              <span className="text-xs text-slate-400 ml-1">
                Posted for {question.date} by {question.postedByUserName}
              </span>
            </div>
          </div>

          <button
            id="close-problem-details-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Summary */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Core Objective
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              {question.summary}
            </p>
          </div>

          {/* Full Question Statement */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-600" />
              Question Statement
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {question.statement}
            </div>
          </div>

          {/* Examples */}
          {question.examples && question.examples.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Examples & Test Cases
              </h3>
              <div className="space-y-3">
                {question.examples.map((ex, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 font-mono text-xs"
                  >
                    <div className="text-slate-400 font-semibold font-sans">
                      Example {index + 1}:
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 shrink-0 font-sans font-semibold">Input:</span>
                      <code className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {ex.input}
                      </code>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 shrink-0 font-sans font-semibold">Output:</span>
                      <code className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        {ex.output}
                      </code>
                    </div>
                    {ex.explanation && (
                      <div className="text-slate-600 text-xs font-sans mt-1 pt-1 border-t border-slate-100">
                        <strong className="text-slate-700">Explanation: </strong>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          {question.constraints && question.constraints.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                Constraints
              </h3>
              <ul className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 font-mono text-xs text-slate-700">
                {question.constraints.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use Cases & Edge Cases */}
          {question.useCases && question.useCases.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Key Use Cases & Edge Cases
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {question.useCases.map((uc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs text-slate-800 leading-relaxed"
                  >
                    <strong className="text-emerald-800">Case {i + 1}: </strong>
                    {uc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Efficiency */}
          {question.recommendedComplexity && (
            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Complexity Benchmarks
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Optimal solutions should meet or exceed these limits:
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 shadow-2xs">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Time: {question.recommendedComplexity.time}
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 shadow-2xs">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  Space: {question.recommendedComplexity.space}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <a
            href={question.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-300 hover:bg-white transition-colors"
          >
            <span>Open on LeetCode</span>
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              id="details-submit-solution-btn"
              onClick={() => {
                onClose();
                onOpenSubmitModal(question);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Your Solution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
