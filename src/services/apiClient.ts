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
  try {
    const data = await safeFetchJson<GroupData>('/api/group-data', undefined, 'Could not fetch group data');
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Backend /api/group-data request failed, falling back to localStorage:', err);
  }

  // Fallback to local storage if API is temporarily unavailable
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  return {
    members: [],
    questions: [],
    submissions: [],
  };
}

export async function postNewProblem(params: {
  input: string;
  targetDate: string;
  postedByUserId: string;
  postedByUserName: string;
}): Promise<{ question: DailyQuestion; questions: DailyQuestion[] }> {
  const result = await safeFetchJson<{ question: DailyQuestion; questions: DailyQuestion[] }>(
    '/api/parse-problem',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Failed to parse LeetCode problem'
  );

  return {
    question: result.question,
    questions: result.questions,
  };
}

export async function submitSolution(params: {
  questionId: string;
  userId: string;
  userName: string;
  userInitials: string;
  userAvatarColor: string;
  submissionUrl: string;
  codeSnippet?: string;
}): Promise<{ submission: QuestionSubmission; submissions: QuestionSubmission[] }> {
  const result = await safeFetchJson<{ submission: QuestionSubmission; submissions: QuestionSubmission[] }>(
    '/api/analyze-submission',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Failed to analyze submission'
  );

  return {
    submission: result.submission,
    submissions: result.submissions,
  };
}

export async function createMember(params: {
  name: string;
  handle?: string;
  bio?: string;
  avatarColor?: string;
}): Promise<{ member: GroupMember; members: GroupMember[] }> {
  const result = await safeFetchJson<{ member: GroupMember; members: GroupMember[] }>(
    '/api/members',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Failed to create member'
  );

  return {
    member: result.member,
    members: result.members,
  };
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(userId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}
