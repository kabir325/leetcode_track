import React from 'react';
import { GroupMember, DailyQuestion, QuestionSubmission } from '../types.ts';
import {
  X,
  User,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  UploadCloud,
  Cpu,
  HardDrive,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ProfileModalProps {
  member: GroupMember | null;
  isOpen: boolean;
  onClose: () => void;
  questions: DailyQuestion[];
  submissions: QuestionSubmission[];
  selectedDate: string;
  onOpenSubmitModal: (question?: DailyQuestion) => void;
  onOpenSolutionModal: (submission: QuestionSubmission, question: DailyQuestion) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  member,
  isOpen,
  onClose,
  questions,
  submissions,
  selectedDate,
  onOpenSubmitModal,
  onOpenSolutionModal,
}) => {
  if (!isOpen || !member) return null;

  // Member's all-time submissions
  const memberSubmissions = submissions.filter((s) => s.userId === member.id);

  // Today's questions and member's status for them
  const todayQuestions = questions.filter((q) => q.date === selectedDate);
  const solvedTodayQuestionIds = new Set(
    memberSubmissions
      .filter((s) => todayQuestions.some((q) => q.id === s.questionId))
      .map((s) => s.questionId)
  );

  // Calculate difficulty breakdown
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  memberSubmissions.forEach((sub) => {
    const q = questions.find((item) => item.id === sub.questionId);
    if (q) {
      if (q.difficulty === 'Easy') easyCount++;
      if (q.difficulty === 'Medium') mediumCount++;
      if (q.difficulty === 'Hard') hardCount++;
    }
  });

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="profile-modal-container"
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with profile banner */}
        <div className="relative p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100">
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-white font-display font-bold text-xl shadow-md ring-4 ring-white`}
              >
                {member.avatarInitials}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">
                  {member.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-slate-500">
                    @{member.handle}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Group Member
                  </span>
                </div>
                {member.bio && (
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {member.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Submit from Profile */}
            <button
              id="profile-upload-solution-btn"
              onClick={() => {
                onClose();
                onOpenSubmitModal();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Submission URL</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-200/80">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Solved</span>
              <span className="text-lg font-bold font-mono text-slate-900">{memberSubmissions.length}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Easy</span>
              <span className="text-lg font-bold font-mono text-emerald-700">{easyCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Medium</span>
              <span className="text-lg font-bold font-mono text-amber-700">{mediumCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Hard</span>
              <span className="text-lg font-bold font-mono text-rose-700">{hardCount}</span>
            </div>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Today's Question Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Assigned for {selectedDate} ({solvedTodayQuestionIds.size}/{todayQuestions.length} completed)
              </h3>
            </div>

            {todayQuestions.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                No questions posted for this day.
              </p>
            ) : (
              <div className="space-y-2">
                {todayQuestions.map((q) => {
                  const isSolved = solvedTodayQuestionIds.has(q.id);
                  const sub = memberSubmissions.find((s) => s.questionId === q.id);

                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isSolved
                          ? 'bg-emerald-50/50 border-emerald-200/80'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {q.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        {sub && (
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-600">
                            <span>Time: {sub.timeComplexity}</span>
                            <span>•</span>
                            <span>Space: {sub.spaceComplexity}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        {isSolved && sub ? (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenSolutionModal(sub, q);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Solution</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenSubmitModal(q);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload URL</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Submissions History */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Verified Submissions & Complexity History ({memberSubmissions.length})
            </h3>

            {memberSubmissions.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No submissions recorded yet for {member.name}.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberSubmissions.map((sub) => {
                  const q = questions.find((item) => item.id === sub.questionId);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        if (q) {
                          onClose();
                          onOpenSolutionModal(sub, q);
                        }
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {q?.title || 'LeetCode Question'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {sub.language}
                          </span>
                        </div>
                        {sub.approach && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {sub.approach}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          <Cpu className="w-3 h-3 text-blue-500" />
                          {sub.timeComplexity}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          <HardDrive className="w-3 h-3 text-emerald-500" />
                          {sub.spaceComplexity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
