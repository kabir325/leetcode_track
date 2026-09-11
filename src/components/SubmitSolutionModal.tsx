import React, { useState, useEffect } from 'react';
import { DailyQuestion, QuestionSubmission, GroupMember, SubmissionStatus } from '../types.ts';
import { submitSolution } from '../services/apiClient.ts';
import {
  X,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Cpu,
  HardDrive,
  Code2,
  ClipboardPaste,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';

interface SubmitSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestion: DailyQuestion | null;
  allQuestions: DailyQuestion[];
  currentMember: GroupMember | null;
  onSubmissionSuccess: (submission: QuestionSubmission) => void;
}

const COMMON_LANGUAGES = [
  'Python 3',
  'C++',
  'Java',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'C#',
  'C',
  'Kotlin',
  'Swift',
  'Python',
  'SQL',
];

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
  const [status, setStatus] = useState<SubmissionStatus>('Accepted');
  const [language, setLanguage] = useState<string>('Python 3');
  const [runtime, setRuntime] = useState<string>('');
  const [memory, setMemory] = useState<string>('');
  const [runtimePercentile, setRuntimePercentile] = useState<string>('');
  const [memoryPercentile, setMemoryPercentile] = useState<string>('');
  const [testcasesPassed, setTestcasesPassed] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [approach, setApproach] = useState<string>('');
  const [codeSnippet, setCodeSnippet] = useState<string>('');

  const [pasteHelperText, setPasteHelperText] = useState<string>('');
  const [showPasteHelper, setShowPasteHelper] = useState<boolean>(false);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);

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

  // Quick parser when user pastes text from LeetCode
  const parseLeetCodeText = (text: string) => {
    if (!text.trim()) return;

    let detectedStatus: SubmissionStatus | null = null;
    let detectedLang: string | null = null;
    let detectedRt: string | null = null;
    let detectedMem: string | null = null;
    let detectedTestcases: string | null = null;
    const detectedTokens: string[] = [];

    // Check status
    if (/wrong\s*answer/i.test(text)) {
      detectedStatus = 'Wrong Answer';
      detectedTokens.push('Status: Wrong Answer');
    } else if (/time\s*limit\s*exceeded/i.test(text) || /\bTLE\b/i.test(text)) {
      detectedStatus = 'Time Limit Exceeded';
      detectedTokens.push('Status: Time Limit Exceeded');
    } else if (/memory\s*limit\s*exceeded/i.test(text) || /\bMLE\b/i.test(text)) {
      detectedStatus = 'Memory Limit Exceeded';
      detectedTokens.push('Status: Memory Limit Exceeded');
    } else if (/runtime\s*error/i.test(text)) {
      detectedStatus = 'Runtime Error';
      detectedTokens.push('Status: Runtime Error');
    } else if (/compile\s*error/i.test(text)) {
      detectedStatus = 'Compile Error';
      detectedTokens.push('Status: Compile Error');
    } else if (/accepted/i.test(text)) {
      detectedStatus = 'Accepted';
      detectedTokens.push('Status: Accepted');
    }

    // Check testcases passed e.g. "14 / 85 testcases passed" or "14/85"
    const testcaseMatch = text.match(/(\d+)\s*\/\s*(\d+)\s*(testcases?\s*passed)?/i);
    if (testcaseMatch) {
      detectedTestcases = `${testcaseMatch[1]} / ${testcaseMatch[2]} testcases passed`;
      detectedTokens.push(detectedTestcases);
    }

    // Check language
    if (/\b(c\+\+|cpp)\b/i.test(text)) {
      detectedLang = 'C++';
    } else if (/\b(python\s*3|python3)\b/i.test(text)) {
      detectedLang = 'Python 3';
    } else if (/\b(python)\b/i.test(text) && !/python\s*3/i.test(text)) {
      detectedLang = 'Python';
    } else if (/\b(java)\b/i.test(text) && !/javascript/i.test(text)) {
      detectedLang = 'Java';
    } else if (/\b(typescript|ts)\b/i.test(text)) {
      detectedLang = 'TypeScript';
    } else if (/\b(javascript|js)\b/i.test(text)) {
      detectedLang = 'JavaScript';
    } else if (/\b(golang|go)\b/i.test(text)) {
      detectedLang = 'Go';
    } else if (/\b(rust)\b/i.test(text)) {
      detectedLang = 'Rust';
    }

    if (detectedLang) {
      detectedTokens.push(`Language: ${detectedLang}`);
    }

    // Check runtime e.g. "Runtime: 35 ms" or "35 ms"
    const rtMatch = text.match(/(\d+)\s*ms/i);
    if (rtMatch) {
      detectedRt = `${rtMatch[1]} ms`;
      detectedTokens.push(`Runtime: ${detectedRt}`);
    }

    // Check memory e.g. "16.4 MB"
    const memMatch = text.match(/([\d.]+)\s*MB/i);
    if (memMatch) {
      detectedMem = `${memMatch[1]} MB`;
      detectedTokens.push(`Memory: ${detectedMem}`);
    }

    // Check Beats %
    const beatsMatches = text.match(/beats\s*([\d.]+)%/gi);
    if (beatsMatches && beatsMatches[0]) {
      setRuntimePercentile(beatsMatches[0]);
    }

    if (detectedStatus) setStatus(detectedStatus);
    if (detectedLang) setLanguage(detectedLang);
    if (detectedRt) setRuntime(detectedRt);
    if (detectedMem) setMemory(detectedMem);
    if (detectedTestcases) setTestcasesPassed(detectedTestcases);

    if (detectedTokens.length > 0) {
      setDetectedBadge(`Auto-filled: ${detectedTokens.join(' • ')}`);
    }
  };

  // Auto-detect language when pasting code
  const handleCodeChange = (val: string) => {
    setCodeSnippet(val);
    if (!val.trim()) return;

    if (val.includes('#include') || val.includes('std::') || val.includes('vector<')) {
      setLanguage('C++');
    } else if (val.includes('public class') || val.includes('System.out')) {
      setLanguage('Java');
    } else if (val.includes('def ') || val.includes('class Solution:')) {
      setLanguage('Python 3');
    } else if (val.includes('interface ') || val.includes(': number') || val.includes(': string')) {
      setLanguage('TypeScript');
    } else if (val.includes('const ') || val.includes('function ') || val.includes('let ')) {
      setLanguage('JavaScript');
    } else if (val.includes('func ') && val.includes('package ')) {
      setLanguage('Go');
    } else if (val.includes('fn ') && val.includes('let mut')) {
      setLanguage('Rust');
    }
  };

  if (!isOpen) return null;

  const targetQuestion = allQuestions.find((q) => q.id === questionId) || selectedQuestion;
  const isAccepted = status === 'Accepted';

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
    if (!submissionUrl.trim() && !codeSnippet.trim() && !testcasesPassed.trim() && !runtime.trim()) {
      setError('Please provide your LeetCode submission URL, solution code, or test result details.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(
      isAccepted
        ? 'Connecting to AI submission analyzer...'
        : `Analyzing ${status} outcome and edge case behavior...`
    );

    try {
      setTimeout(() => {
        setLoadingStep(
          isAccepted
            ? 'Evaluating time & space algorithmic complexity...'
            : 'Analyzing Big-O causes of failure (timeouts, edge cases)...'
        );
      }, 1200);

      const result = await submitSolution({
        questionId,
        userId: currentMember.id,
        userName: currentMember.name,
        userInitials: currentMember.avatarInitials,
        userAvatarColor: currentMember.avatarColor,
        submissionUrl: submissionUrl.trim(),
        status,
        language,
        runtime: runtime.trim() || undefined,
        memory: memory.trim() || undefined,
        runtimePercentile: runtimePercentile.trim() || undefined,
        memoryPercentile: memoryPercentile.trim() || undefined,
        testcasesPassed: testcasesPassed.trim() || undefined,
        errorMessage: errorMessage.trim() || undefined,
        approach: approach.trim() || undefined,
        codeSnippet: codeSnippet.trim() || undefined,
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
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                isAccepted ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {isAccepted ? <UploadCloud className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                {isAccepted ? 'Submit LeetCode Solution' : `Record LeetCode Attempt (${status})`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {targetQuestion
                  ? `For ${targetQuestion.title} (${targetQuestion.difficulty})`
                  : 'Enter your actual submission details from LeetCode'}
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

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {analyzedResult ? (
            /* Analysis Result Card */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  analyzedResult.status === 'Accepted'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : analyzedResult.status === 'Time Limit Exceeded'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                {analyzedResult.status === 'Accepted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : analyzedResult.status === 'Time Limit Exceeded' ? (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold">
                      {analyzedResult.status === 'Accepted'
                        ? 'Submission Successfully Verified & Recorded!'
                        : `Attempt Recorded on LeetCode: ${analyzedResult.status}`}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        analyzedResult.status === 'Accepted'
                          ? 'bg-emerald-200 text-emerald-900'
                          : analyzedResult.status === 'Time Limit Exceeded'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {analyzedResult.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    Logged for <strong>{currentMember?.name}</strong>. Accurate complexity and LeetCode outcome
                    have been saved to the question.
                  </p>
                  {analyzedResult.testcasesPassed && (
                    <div className="mt-1.5 text-xs font-mono font-semibold bg-white/70 px-2 py-1 rounded inline-block">
                      Testcases: {analyzedResult.testcasesPassed}
                    </div>
                  )}
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

              {/* LeetCode Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Language:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {analyzedResult.language}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">LeetCode Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      analyzedResult.status === 'Accepted'
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : analyzedResult.status === 'Time Limit Exceeded'
                        ? 'text-amber-700 bg-amber-50 border border-amber-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {analyzedResult.status}
                  </span>
                </div>

                {analyzedResult.runtime && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Runtime / Outcome:</span>
                    <span className="font-mono font-bold text-slate-800">{analyzedResult.runtime}</span>
                  </div>
                )}

                {analyzedResult.memory && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Memory:</span>
                    <span className="font-mono font-bold text-slate-800">{analyzedResult.memory}</span>
                  </div>
                )}

                {analyzedResult.approach && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-700 block mb-0.5">Approach / Analysis:</span>
                    <span className="text-slate-700 leading-relaxed">{analyzedResult.approach}</span>
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

              {/* Submitting As Member */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Submitting for:</span>
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

              {/* 1. Submission Status / Outcome Selector (Critical for user request) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  LeetCode Submission Outcome <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    id="status-accepted-btn"
                    onClick={() => setStatus('Accepted')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'Accepted'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accepted</span>
                  </button>

                  <button
                    type="button"
                    id="status-wrong-answer-btn"
                    onClick={() => setStatus('Wrong Answer')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'Wrong Answer'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-rose-400 hover:bg-rose-50/50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Wrong Answer</span>
                  </button>

                  <button
                    type="button"
                    id="status-tle-btn"
                    onClick={() => setStatus('Time Limit Exceeded')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'Time Limit Exceeded'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Time Limit (TLE)</span>
                  </button>

                  <button
                    type="button"
                    id="status-runtime-error-btn"
                    onClick={() => setStatus('Runtime Error')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'Runtime Error'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-orange-400 hover:bg-orange-50/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Runtime Error</span>
                  </button>

                  <button
                    type="button"
                    id="status-compile-error-btn"
                    onClick={() => setStatus('Compile Error')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'Compile Error'
                        ? 'bg-red-700 text-white border-red-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-red-400 hover:bg-red-50/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Compile Error</span>
                  </button>

                  <button
                    type="button"
                    id="status-mle-btn"
                    onClick={() => setStatus('Memory Limit Exceeded')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'Memory Limit Exceeded'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:bg-purple-50/50'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Memory Limit</span>
                  </button>
                </div>

                {!isAccepted && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Recording this attempt will preserve your actual <strong>{status}</strong> status and metrics (no fake "Accepted" or "Optimal" labels). Gemini will analyze what caused the failure!
                    </p>
                  </div>
                )}
              </div>

              {/* LeetCode Submission URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    LeetCode Submission URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasteHelper(!showPasteHelper)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>{showPasteHelper ? 'Hide Paste Helper' : 'Quick Paste LeetCode Text'}</span>
                  </button>
                </div>
                <input
                  id="submission-url-input"
                  type="url"
                  placeholder="https://leetcode.com/problems/two-sum/submissions/1209384756/"
                  value={submissionUrl}
                  onChange={(e) => {
                    setSubmissionUrl(e.target.value);
                    parseLeetCodeText(e.target.value);
                  }}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400"
                />
              </div>

              {/* Quick Paste Helper (Optional auto-parser) */}
              {showPasteHelper && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
                  <label className="block font-bold text-blue-900">
                    Paste from LeetCode submission card or result:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 'Wrong Answer 14 / 85 testcases passed Language: C++' or 'Accepted Runtime 32 ms Beats 88%'"
                    value={pasteHelperText}
                    onChange={(e) => {
                      setPasteHelperText(e.target.value);
                      parseLeetCodeText(e.target.value);
                    }}
                    className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  <p className="text-[10px] text-blue-700">
                    Instantly extracts status, testcases passed, language, runtime, and memory.
                  </p>
                </div>
              )}

              {detectedBadge && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{detectedBadge}</span>
                </div>
              )}

              {/* Language & Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Programming Language */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Language <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="submit-language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold"
                  >
                    {COMMON_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {isAccepted ? (
                  <>
                    {/* Runtime */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Runtime (ms)
                      </label>
                      <input
                        id="submission-runtime-input"
                        type="text"
                        placeholder="e.g. 42 ms"
                        value={runtime}
                        onChange={(e) => setRuntime(e.target.value)}
                        className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                      />
                    </div>

                    {/* Memory */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Memory (MB)
                      </label>
                      <input
                        id="submission-memory-input"
                        type="text"
                        placeholder="e.g. 16.4 MB"
                        value={memory}
                        onChange={(e) => setMemory(e.target.value)}
                        className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Test cases passed */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Testcases Passed
                      </label>
                      <input
                        id="submission-testcases-input"
                        type="text"
                        placeholder="e.g. 14 / 85 testcases passed"
                        value={testcasesPassed}
                        onChange={(e) => setTestcasesPassed(e.target.value)}
                        className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* If Failed: Error Message / Failed Testcase Input */}
              {!isAccepted && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Failed Test Case / Error Details (Optional)
                  </label>
                  <input
                    id="submission-error-input"
                    type="text"
                    placeholder="e.g. Input: [3,3] target 6, Expected: [0,1], Output: [1,2] or TLE on large input"
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              )}

              {/* Optional Solution Code Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Solution Code (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Allows Gemini to inspect your actual loops & complexity
                  </span>
                </div>
                <textarea
                  id="submission-code-input"
                  rows={3}
                  placeholder={`Paste your ${language} code snippet here...`}
                  value={codeSnippet}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              {/* Optional Approach / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Approach / Notes (Optional)
                </label>
                <input
                  id="submission-approach-input"
                  type="text"
                  placeholder={
                    isAccepted
                      ? 'e.g. Single-pass Hash Map with complement lookup'
                      : 'e.g. Brute force nested loops that hit TLE on large testcases'
                  }
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="analyze-and-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer ${
                    isAccepted
                      ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                      : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{loadingStep || 'Analyzing submission...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white/80" />
                      <span>
                        {isAccepted
                          ? 'Analyze Complexity & Record Solution'
                          : `Analyze & Record ${status} Attempt`}
                      </span>
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
