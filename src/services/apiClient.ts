import { GroupData, GroupMember, DailyQuestion, QuestionSubmission } from '../types.ts';

const LOCAL_STORAGE_KEY = 'leetcode_group_tracker_data_v1';
const CURRENT_USER_KEY = 'leetcode_group_tracker_current_user_v1';

// Format YYYY-MM-DD
export function formatDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const todayKey = formatDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  if (dateStr === todayKey) {
    return `Today (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }
  if (dateStr === yesterdayKey) {
    return `Yesterday (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const defaultSeedMembers: GroupMember[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    handle: 'alexchen_dev',
    avatarColor: 'from-blue-500 to-indigo-600',
    avatarInitials: 'AC',
    bio: 'Targeting FAANG SDE II. Loves Trees & Graphs.',
  },
  {
    id: 'user-2',
    name: 'Samira Patel',
    handle: 'samirap_code',
    avatarColor: 'from-emerald-500 to-teal-600',
    avatarInitials: 'SP',
    bio: 'DP & Sliding Window enthusiast. Solving daily!',
  },
  {
    id: 'user-3',
    name: 'Jordan Lee',
    handle: 'jordan_algo',
    avatarColor: 'from-amber-500 to-orange-600',
    avatarInitials: 'JL',
    bio: 'Practicing for upcoming technical interviews.',
  },
];

function getStoredLocalData(): GroupData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.members) && parsed.members.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    members: [...defaultSeedMembers],
    questions: [],
    submissions: [],
  };
}

function saveStoredLocalData(data: GroupData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

async function safeFetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
  fallbackErrorMsg = 'Network request failed'
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): ${fallbackErrorMsg}`);
    }
    // If somehow an HTML page was returned
    throw new Error('Received unexpected non-JSON response from server.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || fallbackErrorMsg);
  }
  return data as T;
}

export async function fetchGroupData(): Promise<GroupData> {
  const local = getStoredLocalData();
  try {
    const data = await safeFetchJson<GroupData>('/api/group-data', undefined, 'Could not fetch group data');
    // Merge server members & questions with any locally created items
    const mergedMembers = [...data.members];
    local.members.forEach((lm) => {
      if (!mergedMembers.some((sm) => sm.id === lm.id)) {
        mergedMembers.push(lm);
      }
    });

    const mergedQuestions = [...data.questions];
    local.questions.forEach((lq) => {
      if (!mergedQuestions.some((sq) => sq.id === lq.id)) {
        mergedQuestions.push(lq);
      }
    });

    const mergedSubmissions = [...data.submissions];
    local.submissions.forEach((ls) => {
      if (!mergedSubmissions.some((ss) => ss.id === ls.id)) {
        mergedSubmissions.push(ls);
      }
    });

    const fullMerged: GroupData = {
      members: mergedMembers,
      questions: mergedQuestions,
      submissions: mergedSubmissions,
    };
    saveStoredLocalData(fullMerged);
    return fullMerged;
  } catch (err) {
    console.warn('Backend /api/group-data request failed, using local storage state:', err);
    return local;
  }
}

export async function postNewProblem(params: {
  input: string;
  targetDate: string;
  postedByUserId: string;
  postedByUserName: string;
}): Promise<{ question: DailyQuestion; questions: DailyQuestion[] }> {
  try {
    const result = await safeFetchJson<{ question: DailyQuestion; questions: DailyQuestion[] }>(
      '/api/parse-problem',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      'Failed to parse LeetCode problem'
    );
    const local = getStoredLocalData();
    local.questions = result.questions;
    saveStoredLocalData(local);
    return result;
  } catch (err) {
    console.warn('Backend parse-problem endpoint unavailable, falling back to client extraction:', err);
    const local = getStoredLocalData();
    const cleanUrl = params.input.split('?')[0].replace(/\/$/, '');
    const slug = cleanUrl.includes('/problems/')
      ? cleanUrl.split('/problems/')[1]?.split('/')[0]
      : params.input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const title = (slug || 'problem')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const fallbackQuestion: DailyQuestion = {
      id: `q-${Date.now()}`,
      date: params.targetDate || formatDateKey(new Date()),
      title: title || 'LeetCode Problem',
      slug: slug || 'problem',
      url: params.input.startsWith('http') ? params.input : `https://leetcode.com/problems/${slug || 'problem'}/`,
      difficulty: 'Medium',
      tags: ['Algorithm', 'Data Structures'],
      summary: `Practice problem: ${title}`,
      statement: `Solve and optimize this LeetCode challenge with your group. Refer directly to the question link: ${params.input}`,
      examples: [
        {
          input: 'See LeetCode problem statement for test cases',
          output: 'Optimal solution output',
        },
      ],
      constraints: ['Check LeetCode for complete numerical bounds'],
      useCases: ['Handle empty or single element edge cases', 'Optimize memory and time limits'],
      recommendedComplexity: { time: 'O(n)', space: 'O(1)' },
      postedByUserId: params.postedByUserId || 'user-1',
      postedByUserName: params.postedByUserName || 'Friend',
      createdAt: new Date().toISOString(),
    };

    local.questions.unshift(fallbackQuestion);
    saveStoredLocalData(local);
    return {
      question: fallbackQuestion,
      questions: local.questions,
    };
  }
}

export async function submitSolution(params: {
  questionId: string;
  userId: string;
  userName: string;
  userInitials: string;
  userAvatarColor: string;
  submissionUrl: string;
  status?: import('../types.ts').SubmissionStatus;
  language?: string;
  runtime?: string;
  memory?: string;
  runtimePercentile?: string;
  memoryPercentile?: string;
  testcasesPassed?: string;
  errorMessage?: string;
  approach?: string;
  codeSnippet?: string;
}): Promise<{ submission: QuestionSubmission; submissions: QuestionSubmission[] }> {
  try {
    const result = await safeFetchJson<{ submission: QuestionSubmission; submissions: QuestionSubmission[] }>(
      '/api/analyze-submission',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      'Failed to analyze submission'
    );
    const local = getStoredLocalData();
    local.submissions = result.submissions;
    saveStoredLocalData(local);
    return result;
  } catch (err) {
    console.warn('Backend analyze-submission endpoint unavailable, falling back to local evaluation:', err);
    const local = getStoredLocalData();

    const finalStatus: import('../types.ts').SubmissionStatus = params.status || 'Accepted';
    const isAccepted = finalStatus === 'Accepted';

    let detectedLang = params.language || '';
    if (!detectedLang && params.codeSnippet) {
      if (params.codeSnippet.includes('#include') || params.codeSnippet.includes('std::')) {
        detectedLang = 'C++';
      } else if (params.codeSnippet.includes('public class')) {
        detectedLang = 'Java';
      } else if (params.codeSnippet.includes('function') || params.codeSnippet.includes('const')) {
        detectedLang = 'JavaScript';
      } else if (params.codeSnippet.includes('def ') || params.codeSnippet.includes('class Solution:')) {
        detectedLang = 'Python 3';
      }
    }
    if (!detectedLang) {
      detectedLang = 'Python 3';
    }

    const finalRuntime = isAccepted
      ? (params.runtime || 'Recorded on LeetCode')
      : (params.testcasesPassed ? `${params.testcasesPassed}` : (params.runtime || `N/A (${finalStatus})`));

    const finalMemory = isAccepted
      ? (params.memory || 'Recorded on LeetCode')
      : (params.memory || 'N/A');

    const defaultApproach = params.approach
      ? params.approach
      : isAccepted
      ? `Algorithmic solution in ${detectedLang}`
      : `Attempted solution - ${finalStatus}`;

    const fallbackSubmission: QuestionSubmission = {
      id: `sub-${Date.now()}`,
      questionId: params.questionId,
      userId: params.userId,
      userName: params.userName,
      userInitials: params.userInitials,
      userAvatarColor: params.userAvatarColor,
      submissionUrl: params.submissionUrl,
      status: finalStatus,
      timeComplexity: isAccepted ? 'O(n)' : (finalStatus === 'Time Limit Exceeded' ? 'O(n²)' : 'O(n)'),
      spaceComplexity: 'O(1)',
      timeExplanation: isAccepted
        ? 'Passes within LeetCode time limits'
        : (finalStatus === 'Time Limit Exceeded'
          ? 'High time complexity caused execution to exceed time limit (TLE)'
          : `Execution halted with ${finalStatus}`),
      spaceExplanation: 'Memory overhead as reported on LeetCode',
      language: detectedLang,
      runtime: finalRuntime,
      memory: finalMemory,
      runtimePercentile: params.runtimePercentile,
      memoryPercentile: params.memoryPercentile,
      testcasesPassed: params.testcasesPassed,
      errorMessage: params.errorMessage,
      approach: defaultApproach,
      codeSnippet: params.codeSnippet,
      submittedAt: new Date().toISOString(),
    };

    const existingIdx = local.submissions.findIndex(
      (s) => s.questionId === params.questionId && s.userId === params.userId
    );
    if (existingIdx >= 0) {
      local.submissions[existingIdx] = fallbackSubmission;
    } else {
      local.submissions.push(fallbackSubmission);
    }

    saveStoredLocalData(local);
    return {
      submission: fallbackSubmission,
      submissions: local.submissions,
    };
  }
}

export async function createMember(params: {
  name: string;
  handle?: string;
  bio?: string;
  avatarColor?: string;
}): Promise<{ member: GroupMember; members: GroupMember[] }> {
  try {
    const result = await safeFetchJson<{ member: GroupMember; members: GroupMember[] }>(
      '/api/members',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      'Failed to create member'
    );
    const local = getStoredLocalData();
    local.members = result.members;
    saveStoredLocalData(local);
    return result;
  } catch (err) {
    console.warn('Backend /api/members unavailable, falling back to local creation:', err);
    const local = getStoredLocalData();
    const initials = params.name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('') || 'LC';

    const colorOptions = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-purple-500 to-violet-600',
      'from-cyan-500 to-blue-600',
    ];
    const selectedColor = params.avatarColor || colorOptions[local.members.length % colorOptions.length];

    const newMember: GroupMember = {
      id: `user-${Date.now()}`,
      name: params.name.trim(),
      handle: (params.handle || params.name.toLowerCase().replace(/\s+/g, '_')).trim(),
      avatarColor: selectedColor,
      avatarInitials: initials,
      bio: params.bio || 'Solving algorithms with friends.',
    };

    local.members.push(newMember);
    saveStoredLocalData(local);
    return {
      member: newMember,
      members: local.members,
    };
  }
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(userId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

export async function deleteQuestion(
  questionId: string
): Promise<{ questions: DailyQuestion[]; submissions: QuestionSubmission[] }> {
  const local = getStoredLocalData();
  local.questions = local.questions.filter((q) => q.id !== questionId);
  local.submissions = local.submissions.filter((s) => s.questionId !== questionId);
  saveStoredLocalData(local);

  try {
    const res = await safeFetchJson<{ questions: DailyQuestion[]; submissions: QuestionSubmission[] }>(
      `/api/questions/${questionId}`,
      { method: 'DELETE' },
      'Failed to delete question'
    );
    local.questions = res.questions;
    local.submissions = res.submissions;
    saveStoredLocalData(local);
    return res;
  } catch (err) {
    console.warn('Backend delete question failed, handled in local storage:', err);
    return { questions: local.questions, submissions: local.submissions };
  }
}

export async function deleteMember(
  memberId: string
): Promise<{ members: GroupMember[]; submissions: QuestionSubmission[] }> {
  const local = getStoredLocalData();
  local.members = local.members.filter((m) => m.id !== memberId);
  local.submissions = local.submissions.filter((s) => s.userId !== memberId);
  saveStoredLocalData(local);

  if (getCurrentUserId() === memberId) {
    if (local.members.length > 0) {
      setCurrentUserId(local.members[0].id);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  try {
    const res = await safeFetchJson<{ members: GroupMember[]; submissions: QuestionSubmission[] }>(
      `/api/members/${memberId}`,
      { method: 'DELETE' },
      'Failed to delete member'
    );
    local.members = res.members;
    local.submissions = res.submissions;
    saveStoredLocalData(local);
    return res;
  } catch (err) {
    console.warn('Backend delete member failed, handled in local storage:', err);
    return { members: local.members, submissions: local.submissions };
  }
}

export async function deleteSubmission(
  submissionId: string
): Promise<{ submissions: QuestionSubmission[] }> {
  const local = getStoredLocalData();
  local.submissions = local.submissions.filter((s) => s.id !== submissionId);
  saveStoredLocalData(local);

  try {
    const res = await safeFetchJson<{ submissions: QuestionSubmission[] }>(
      `/api/submissions/${submissionId}`,
      { method: 'DELETE' },
      'Failed to delete submission'
    );
    local.submissions = res.submissions;
    saveStoredLocalData(local);
    return res;
  } catch (err) {
    console.warn('Backend delete submission failed, handled in local storage:', err);
    return { submissions: local.submissions };
  }
}

export async function resetGroupData(): Promise<GroupData> {
  try {
    const res = await safeFetchJson<GroupData>(
      '/api/reset-data',
      { method: 'POST' },
      'Failed to reset data'
    );
    saveStoredLocalData(res);
    return res;
  } catch (err) {
    console.warn('Backend reset failed, resetting local data:', err);
    const resetData: GroupData = {
      members: [...defaultSeedMembers],
      questions: [],
      submissions: [],
    };
    saveStoredLocalData(resetData);
    return resetData;
  }
}

export async function clearAllQuestionsAndSubmissions(): Promise<GroupData> {
  const local = getStoredLocalData();
  local.questions = [];
  local.submissions = [];
  saveStoredLocalData(local);

  try {
    const res = await safeFetchJson<GroupData>(
      '/api/clear-all',
      { method: 'POST' },
      'Failed to clear data'
    );
    saveStoredLocalData(res);
    return res;
  } catch (err) {
    console.warn('Backend clear failed, handled in local storage:', err);
    return local;
  }
}

