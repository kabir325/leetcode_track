import React, { useState, useEffect } from 'react';
import { DailyQuestion, QuestionSubmission, GroupMember } from '../types.ts';
import { submitSolution } from '../services/apiClient.ts';
import {
  X,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  Cpu,
  HardDrive,
  Code2,
} from 'lucide-react';

interface SubmitSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestion: DailyQuestion | null;
  allQuestions: DailyQuestion[];
  currentMember: GroupMember | null;
  onSubmissionSuccess: (submission: QuestionSubmission) => void;
}

export const SubmitSolutionModal: React.FC<SubmitSolutionModalProps> = ({
  isOpen,
  onClose,
  selectedQuestion,
  allQuestions,
  currentMember,
  onSubmissionSuccess,
}) => {
  const [questionId, setQuestionId] = useState<string>('');
  const [submissionUrl, setSubmissionUrl] = useState<string>('');
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analyzedResult, setAnalyzedResult] = useState<QuestionSubmission | null>(null);

  useEffect(() => {
    if (selectedQuestion) {
      setQuestionId(selectedQuestion.id);
    } else if (allQuestions.length > 0 && !questionId) {
      setQuestionId(allQuestions[0].id);
    }
    setError(null);
    setAnalyzedResult(null);
  }, [selectedQuestion, allQuestions, isOpen]);

  if (!isOpen) return null;

  const targetQuestion = allQuestions.find((q) => q.id === questionId) || selectedQuestion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) {
      setError('Please select or log into a profile first.');
      return;
    }
    if (!questionId) {
      setError('Please select a question to submit.');
      return;
    }
    if (!submissionUrl.trim() && !codeSnippet.trim()) {
      setError('Please provide your LeetCode submission URL or paste your solution code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep('Connecting to AI submission analyzer...');

    try {
      setTimeout(() => {
        setLoadingStep('Evaluating time & space algorithmic complexity...');
      }, 1200);

      setTimeout(() => {
        setLoadingStep('Extracting runtime benchmarks and approach...');
      }, 2500);

      const result = await submitSolution({
        questionId,
        userId: currentMember.id,
        userName: currentMember.name,
        userInitials: currentMember.avatarInitials,
        userAvatarColor: currentMember.avatarColor,
        submissionUrl: submissionUrl.trim(),
        codeSnippet: codeSnippet.trim(),
      });

      setAnalyzedResult(result.submission);
      onSubmissionSuccess(result.submission);
    } catch (err: any) {
      console.error('Error submitting solution:', err);
      setError(err.message || 'Failed to analyze submission. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div
      id="submit-solution-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="submit-solution-modal-container"
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                Upload LeetCode Submission
              </h2>
              <p className="text-xs text-slate-500">
                AI will verify your solution and calculate Time & Space complexity
              </p>
            </div>
          </div>

          <button
            id="close-submit-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {analyzedResult ? (
            /* Analysis Result Card */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Submission Successfully Verified!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Marked as completed for <strong>{currentMember?.name}</strong>. Your complexity breakdown has been added to the question overview.
                  </p>
                </div>
              </div>

              {/* Analyzed Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    Time Complexity
                  </span>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {analyzedResult.timeComplexity}
                  </div>
                  {analyzedResult.timeExplanation && (
                    <p className="text-xs text-slate-600 mt-1 leading-normal">
                      {analyzedResult.timeExplanation}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                    Space Complexity
                  </span>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {analyzedResult.spaceComplexity}
                  </div>
                  {analyzedResult.spaceExplanation && (
                    <p className="text-xs text-slate-600 mt-1 leading-normal">
                      {analyzedResult.spaceExplanation}
                    </p>
                  )}
                </div>
              </div>

              {/* Approach & Language */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Language:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {analyzedResult.language}
                  </span>
                </div>
                {analyzedResult.runtime && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Runtime:</span>
                    <span className="font-mono text-slate-800">{analyzedResult.runtime}</span>
                  </div>
                )}
                {analyzedResult.approach && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-700 block mb-0.5">Approach:</span>
                    <span className="text-slate-600">{analyzedResult.approach}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="analysis-done-btn"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Done & Back to Questions
                </button>
              </div>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Submitter info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Submitting as:</span>
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
                  <span className="text-xs font-semibold text-rose-600">No profile selected</span>
                )}
              </div>

              {/* Select Question */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Question
                </label>
                <select
                  id="submit-question-select"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  {allQuestions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.leetcodeNumber ? `#${q.leetcodeNumber} ` : ''}
                      {q.title} ({q.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {/* LeetCode Submission URL Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  LeetCode Submission URL
                </label>
                <input
                  id="submission-url-input"
                  type="url"
                  placeholder="https://leetcode.com/problems/two-sum/submissions/1209384756/"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Paste the direct submission URL from your LeetCode Submissions tab.
                </p>
              </div>

              {/* Optional Solution Code Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Solution Code (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Helps AI analyze accurate Big-O
                  </span>
                </div>
                <textarea
                  id="submission-code-input"
                  rows={4}
                  placeholder="Paste your Python/C++/Java code here to let Gemini inspect every loop and data structure..."
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="analyze-and-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{loadingStep || 'Analyzing with AI...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Analyze Complexity & Mark Done</span>
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
