import React, { useState, useEffect } from 'react';
import { GroupMember, DailyQuestion, QuestionSubmission } from './types.ts';
import {
  fetchGroupData,
  getCurrentUserId,
  setCurrentUserId,
  formatDateKey,
} from './services/apiClient.ts';
import { Navbar } from './components/Navbar.tsx';
import { DailyOverview } from './components/DailyOverview.tsx';
import { QuestionCard } from './components/QuestionCard.tsx';
import { ProblemDetailsModal } from './components/ProblemDetailsModal.tsx';
import { SubmitSolutionModal } from './components/SubmitSolutionModal.tsx';
import { SolutionDetailsModal } from './components/SolutionDetailsModal.tsx';
import { PostQuestionModal } from './components/PostQuestionModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { MemberSwitcherModal } from './components/MemberSwitcherModal.tsx';
import {
  PlusCircle,
  HelpCircle,
  Sparkles,
  Award,
  Layers,
  CheckCircle2,
  Calendar,
  Users,
} from 'lucide-react';

export default function App() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [submissions, setSubmissions] = useState<QuestionSubmission[]>([]);
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Active targets for inspection modals
  const [detailedQuestion, setDetailedQuestion] = useState<DailyQuestion | null>(null);
  const [submittingQuestion, setSubmittingQuestion] = useState<DailyQuestion | null>(null);
  const [inspectingSubmission, setInspectingSubmission] = useState<{
    submission: QuestionSubmission;
    question: DailyQuestion;
  } | null>(null);
  const [inspectingMember, setInspectingMember] = useState<GroupMember | null>(null);

  // Load group data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchGroupData();
        setMembers(data.members || []);
        setQuestions(data.questions || []);
        setSubmissions(data.submissions || []);

        // Restore active user from localStorage or pick the first member
        const savedUserId = getCurrentUserId();
        const found = data.members?.find((m) => m.id === savedUserId);
        if (found) {
          setCurrentMember(found);
        } else if (data.members && data.members.length > 0) {
          setCurrentMember(data.members[0]);
          setCurrentUserId(data.members[0].id);
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Set active user
  const handleSelectMember = (member: GroupMember | null) => {
    setCurrentMember(member);
    if (member) {
      setCurrentUserId(member.id);
    } else {
      localStorage.removeItem('leetcode_group_tracker_current_user_v1');
    }
  };

  // Add question handler
  const handleQuestionAdded = (newQuestion: DailyQuestion) => {
    setQuestions((prev) => [newQuestion, ...prev]);
    // Set view date to that question's date so user sees it immediately
    setSelectedDate(newQuestion.date);
  };

  // Submission handler
  const handleSubmissionSuccess = (newSub: QuestionSubmission) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex((s) => s.id === newSub.id || (s.questionId === newSub.questionId && s.userId === newSub.userId));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSub;
        return copy;
      }
      return [newSub, ...prev];
    });
  };

  // Add member handler
  const handleMemberCreated = (newMember: GroupMember) => {
    setMembers((prev) => [...prev, newMember]);
  };

  // Filter questions for the selected day
  const dailyQuestions = questions.filter((q) => q.date === selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Main Top Navigation */}
      <Navbar
        currentMember={currentMember}
        members={members}
        onOpenPostModal={() => setIsPostModalOpen(true)}
        onOpenProfileModal={() => {
          setInspectingMember(currentMember);
          setIsProfileModalOpen(true);
        }}
        onOpenSwitchModal={() => setIsSwitchModalOpen(true)}
        selectedDateStr={selectedDate}
        onSelectToday={() => setSelectedDate(formatDateKey(new Date()))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Overview Header & Group Standup */}
        <DailyOverview
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          questions={questions}
          submissions={submissions}
          members={members}
          currentMember={currentMember}
          onOpenPostModal={() => setIsPostModalOpen(true)}
          onOpenProfileForMember={(member) => {
            setInspectingMember(member);
            setIsProfileModalOpen(true);
          }}
        />

        {/* Daily Questions Section */}
        <section id="daily-questions-container" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">
                Daily Problems ({dailyQuestions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Problems posted for this day. Hover or click friends' circular logos to inspect their time & space complexities.
              </p>
            </div>

            {dailyQuestions.length > 0 && (
              <button
                id="add-another-question-btn"
                onClick={() => setIsPostModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Another Question</span>
              </button>
            )}
          </div>

          {dailyQuestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {dailyQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  submissions={submissions}
                  members={members}
                  currentMember={currentMember}
                  onOpenDetailsModal={(q) => setDetailedQuestion(q)}
                  onOpenSubmitModal={(q) => {
                    setSubmittingQuestion(q);
                    setIsSubmitModalOpen(true);
                  }}
                  onOpenSolutionModal={(sub, q) => setInspectingSubmission({ submission: sub, question: q })}
                />
              ))}
            </div>
          ) : (
            /* Empty State for Date */
            <div
              id="empty-date-questions"
              className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-display font-bold text-slate-900">
                  No Questions Scheduled for {selectedDate}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Anyone in the group can post questions for today! Simply paste any LeetCode problem URL or name, and AI will extract the full question statement, use cases, and examples.
                </p>
              </div>
              <div>
                <button
                  id="empty-post-question-btn"
                  onClick={() => setIsPostModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Post Problem for {selectedDate}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <PostQuestionModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        targetDate={selectedDate}
        currentMember={currentMember}
        onQuestionAdded={handleQuestionAdded}
      />

      <ProblemDetailsModal
        question={detailedQuestion}
        onClose={() => setDetailedQuestion(null)}
        onOpenSubmitModal={(q) => {
          setSubmittingQuestion(q);
          setIsSubmitModalOpen(true);
        }}
      />

      <SubmitSolutionModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSubmittingQuestion(null);
        }}
        selectedQuestion={submittingQuestion}
        allQuestions={questions}
        currentMember={currentMember}
        onSubmissionSuccess={handleSubmissionSuccess}
      />

      <SolutionDetailsModal
        submission={inspectingSubmission?.submission || null}
        question={inspectingSubmission?.question || null}
        onClose={() => setInspectingSubmission(null)}
      />

      <ProfileModal
        member={inspectingMember || currentMember}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setInspectingMember(null);
        }}
        questions={questions}
        submissions={submissions}
        selectedDate={selectedDate}
        onOpenSubmitModal={(q) => {
          setSubmittingQuestion(q || null);
          setIsSubmitModalOpen(true);
        }}
        onOpenSolutionModal={(sub, q) => setInspectingSubmission({ submission: sub, question: q })}
      />

      <MemberSwitcherModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        members={members}
        currentMember={currentMember}
        onSelectMember={handleSelectMember}
        onMemberCreated={handleMemberCreated}
      />
    </div>
  );
}
