import React from 'react';
import { GroupMember, DailyQuestion, QuestionSubmission } from '../types.ts';
import { formatDisplayDate, formatDateKey } from '../services/apiClient.ts';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Award,
  Target,
  Plus,
} from 'lucide-react';

interface DailyOverviewProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  questions: DailyQuestion[];
  submissions: QuestionSubmission[];
  members: GroupMember[];
  currentMember: GroupMember | null;
  onOpenPostModal: () => void;
  onOpenProfileForMember: (member: GroupMember) => void;
}

export const DailyOverview: React.FC<DailyOverviewProps> = ({
  selectedDate,
  onSelectDate,
  questions,
  submissions,
  members,
  currentMember,
  onOpenPostModal,
  onOpenProfileForMember,
}) => {
  // Questions for current selected date
  const dayQuestions = questions.filter((q) => q.date === selectedDate);
  const dayQuestionIds = new Set(dayQuestions.map((q) => q.id));

  // Submissions for current selected date's questions
  const daySubmissions = submissions.filter((s) => dayQuestionIds.has(s.questionId));

  // Date navigation handlers
  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 1);
    onSelectDate(formatDateKey(d));
  };

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    onSelectDate(formatDateKey(d));
  };

  const isToday = selectedDate === formatDateKey(new Date());

  // Calculate each member's completion for this day
  const memberProgress = members.map((member) => {
    const solvedCount = dayQuestions.filter((q) =>
      daySubmissions.some((s) => s.questionId === q.id && s.userId === member.id && (!s.status || s.status === 'Accepted'))
    ).length;
    const attemptedCount = dayQuestions.filter((q) =>
      daySubmissions.some((s) => s.questionId === q.id && s.userId === member.id && s.status && s.status !== 'Accepted')
    ).length;
    const isAllDone = dayQuestions.length > 0 && solvedCount === dayQuestions.length;
    const isPartial = solvedCount > 0 && solvedCount < dayQuestions.length;

    return {
      member,
      solvedCount,
      attemptedCount,
      totalCount: dayQuestions.length,
      isAllDone,
      isPartial,
    };
  });

  return (
    <section id="daily-overview-section" className="mb-8">
      {/* Date Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Date Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-1">
              <button
                id="prev-day-btn"
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-none hover:shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                id="next-day-btn"
                onClick={handleNextDay}
                title="Next Day"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-none hover:shadow-xs cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  {formatDisplayDate(selectedDate)}
                </h1>
                {isToday && (
                  <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {dayQuestions.length === 0
                  ? 'No questions scheduled yet for this date.'
                  : `${dayQuestions.length} question${dayQuestions.length === 1 ? '' : 's'} assigned to the group`}
              </p>
            </div>
          </div>

          {/* Right: Quick actions & status */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {!isToday && (
              <button
                id="return-today-btn"
                onClick={() => onSelectDate(formatDateKey(new Date()))}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                Jump to Today
              </button>
            )}

            <button
              id="overview-post-question-btn"
              onClick={onOpenPostModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Daily Question</span>
            </button>
          </div>
        </div>

        {/* Standup Member Progress Row */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              Group Standup Status ({members.length} friends)
            </span>
            <span className="text-xs text-slate-500">
              Total group submissions today: <strong className="text-slate-800 font-semibold">{daySubmissions.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {memberProgress.map(({ member, solvedCount, attemptedCount, totalCount, isAllDone, isPartial }) => {
              const isCurrent = currentMember?.id === member.id;
              return (
                <div
                  key={member.id}
                  id={`standup-card-${member.id}`}
                  onClick={() => onOpenProfileForMember(member)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100'
                      : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs`}
                    >
                      {member.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {member.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block truncate">
                        @{member.handle}
                      </span>
                    </div>
                  </div>

                  {/* Completion badge */}
                  <div className="shrink-0 text-right">
                    {totalCount === 0 ? (
                      <span className="text-[11px] font-medium text-slate-400">No tasks</span>
                    ) : isAllDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {solvedCount}/{totalCount} Done
                      </span>
                    ) : isPartial ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {solvedCount}/{totalCount} Solved
                      </span>
                    ) : attemptedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {attemptedCount} Attempted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                        0/{totalCount} Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
