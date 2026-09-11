import React, { useState } from 'react';
import { DailyQuestion, QuestionSubmission, GroupMember } from '../types.ts';
import {
  ExternalLink,
  BookOpen,
  Check,
  UploadCloud,
  Layers,
  Cpu,
  HardDrive,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QuestionCardProps {
  question: DailyQuestion;
  submissions: QuestionSubmission[];
  members: GroupMember[];
  currentMember: GroupMember | null;
  onOpenDetailsModal: (question: DailyQuestion) => void;
  onOpenSubmitModal: (question: DailyQuestion) => void;
  onOpenSolutionModal: (submission: QuestionSubmission, question: DailyQuestion) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  submissions,
  members,
  currentMember,
  onOpenDetailsModal,
  onOpenSubmitModal,
  onOpenSolutionModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Submissions for this specific question
  const questionSubmissions = submissions.filter((s) => s.questionId === question.id);

  // Check if current logged-in member has submitted
  const currentUserSubmission = currentMember
    ? questionSubmissions.find((s) => s.userId === currentMember.id)
    : null;

  // Difficulty badge styling
  const difficultyStyles = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200/80',
    Hard: 'bg-rose-50 text-rose-700 border-rose-200/80',
  }[question.difficulty] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <article
      id={`question-card-${question.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="p-5 sm:p-6">
        {/* Top Header: Title, LeetCode #, Difficulty, and Link */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {question.leetcodeNumber && (
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  #{question.leetcodeNumber}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 tracking-tight">
                {question.title}
              </h2>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${difficultyStyles}`}
              >
                {question.difficulty}
              </span>
            </div>

            {/* Topic Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
              <span className="text-xs text-slate-400 ml-1">
                • posted by {question.postedByUserName}
              </span>
            </div>
          </div>

          {/* Quick External Link */}
          <a
            href={question.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Problem in LeetCode"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 self-start"
          >
            <span>LeetCode</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Short Summary */}
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {question.summary}
        </p>

        {/* Inline Quick Breakdown Accordion (Question Statement & Use Cases) */}
        {isExpanded && (
          <div className="mb-5 pt-4 pb-2 border-t border-slate-100 space-y-4">
            {/* Statement */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Problem Statement
              </h3>
              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono whitespace-pre-line leading-relaxed">
                {question.statement}
              </div>
            </div>

            {/* Use Cases & Edge Cases */}
            {question.useCases && question.useCases.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Key Use Cases & Edge Cases to Consider
                </h3>
                <ul className="grid grid-cols-1 gap-1.5">
                  {question.useCases.map((useCase, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 bg-amber-50/60 border border-amber-200/60 rounded-lg px-3 py-2 flex items-start gap-2"
                    >
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benchmark Target Complexity */}
            {question.recommendedComplexity && (
              <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-100/70 px-3 py-2 rounded-lg">
                <span className="font-semibold text-slate-700">Target Efficiency:</span>
                <span className="inline-flex items-center gap-1 font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Cpu className="w-3 h-3 text-blue-500" />
                  Time: {question.recommendedComplexity.time}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <HardDrive className="w-3 h-3 text-emerald-500" />
                  Space: {question.recommendedComplexity.space}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Done By Section (Small circular logos for everyone who submitted) */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {/* Title & logos */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Done By:
              </span>

              {questionSubmissions.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {questionSubmissions.map((sub) => {
                    const member = members.find((m) => m.id === sub.userId);
                    return (
                      <button
                        key={sub.id}
                        id={`avatar-submission-${sub.id}`}
                        onClick={() => onOpenSolutionModal(sub, question)}
                        title={`Click to view ${sub.userName}'s solution (${sub.timeComplexity}, ${sub.spaceComplexity})`}
                        className="group relative flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                      >
                        {/* Circular Avatar Logo */}
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                            member?.avatarColor || sub.userAvatarColor
                          } flex items-center justify-center text-white font-bold text-[10px] shadow-2xs`}
                        >
                          {sub.userInitials}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {sub.userName.split(' ')[0]}
                        </span>
                        {/* Time complexity chip */}
                        <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                          {sub.timeComplexity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No submissions yet today — be the first to complete it!
                </span>
              )}
            </div>

            {/* Current user completion status */}
            <div className="shrink-0">
              {currentUserSubmission ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>You Solved ({currentUserSubmission.timeComplexity})</span>
                </span>
              ) : (
                <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  Pending for you
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Toggle Expand / Full Modal breakdown */}
          <div className="flex items-center gap-2">
            <button
              id={`toggle-details-btn-${question.id}`}
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Quick Preview</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              id={`view-full-modal-btn-${question.id}`}
              onClick={() => onOpenDetailsModal(question)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Full Problem Breakdown</span>
            </button>
          </div>

          {/* Submit Solution Button */}
          <div>
            {currentUserSubmission ? (
              <button
                id={`update-solution-btn-${question.id}`}
                onClick={() => onOpenSubmitModal(question)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                <span>Update Submission</span>
              </button>
            ) : (
              <button
                id={`submit-solution-btn-${question.id}`}
                onClick={() => onOpenSubmitModal(question)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-emerald-100" />
                <span>Submit Solution URL</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
