export interface GroupMember {
  id: string;
  name: string;
  handle: string;
  avatarColor: string; // Tailwind gradient classes e.g. "from-blue-500 to-indigo-600"
  avatarInitials: string;
  avatarUrl?: string;
  bio?: string;
}

export interface QuestionSubmission {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userInitials: string;
  userAvatarColor: string;
  submissionUrl: string;
  timeComplexity: string;
  spaceComplexity: string;
  timeExplanation?: string;
  spaceExplanation?: string;
  language: string;
  runtime?: string;
  memory?: string;
  approach?: string;
  codeSnippet?: string;
  submittedAt: string;
}

export interface DailyQuestion {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  leetcodeNumber?: number | string;
  slug: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  summary: string;
  statement: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  useCases: string[];
  recommendedComplexity?: {
    time: string;
    space: string;
  };
  postedByUserId: string;
  postedByUserName: string;
  createdAt: string;
}

export interface GroupData {
  members: GroupMember[];
  questions: DailyQuestion[];
  submissions: QuestionSubmission[];
}
