import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize shared Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory / server state for group questions & submissions
export interface GroupMember {
  id: string;
  name: string;
  handle: string;
  avatarColor: string; // e.g. "from-amber-500 to-orange-600"
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

// Default initial profiles
const defaultMembers: GroupMember[] = [
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

// Today's date helper (local YYYY-MM-DD)
function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = getTodayDateString();

// Seed initial questions so app is rich on first view
const defaultQuestions: DailyQuestion[] = [
  {
    id: 'q-1',
    date: today,
    title: 'Two Sum',
    leetcodeNumber: 1,
    slug: 'two-sum',
    url: 'https://leetcode.com/problems/two-sum/',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    summary: 'Find two indices in an array such that they add up to a specific target.',
    statement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'nums[1] + nums[2] == 6, so indices [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    useCases: [
      'Duplicate values: [3, 3] targeting 6 where the same value appears twice at distinct indices.',
      'Negative numbers: [ -1, -2, -3, -4, -5] with negative target.',
      'Large array performance: Must use single-pass Hash Map O(n) to avoid O(n^2) TLE.',
    ],
    recommendedComplexity: {
      time: 'O(n)',
      space: 'O(n)',
    },
    postedByUserId: 'user-1',
    postedByUserName: 'Alex Chen',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'q-2',
    date: today,
    title: 'Trapping Rain Water',
    leetcodeNumber: 42,
    slug: 'trapping-rain-water',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Monotonic Stack'],
    summary: 'Compute how much water an elevation map can trap after raining.',
    statement: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.',
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
      },
    ],
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    useCases: [
      'Strictly increasing or decreasing elevation: 0 trapped water.',
      'Single peak or bowl shape: test two-pointer boundary convergence.',
      'All flat or all zeros.',
    ],
    recommendedComplexity: {
      time: 'O(n)',
      space: 'O(1)',
    },
    postedByUserId: 'user-2',
    postedByUserName: 'Samira Patel',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const defaultSubmissions: QuestionSubmission[] = [
  {
    id: 'sub-1',
    questionId: 'q-1',
    userId: 'user-1',
    userName: 'Alex Chen',
    userInitials: 'AC',
    userAvatarColor: 'from-blue-500 to-indigo-600',
    submissionUrl: 'https://leetcode.com/problems/two-sum/submissions/1209384756/',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    timeExplanation: 'Single pass through nums array with O(1) hash map operations.',
    spaceExplanation: 'Hash map stores up to n elements in the worst case.',
    language: 'Python 3',
    runtime: '48 ms',
    memory: '17.4 MB',
    approach: 'Single-Pass Hash Map with complement check',
    codeSnippet: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, val in enumerate(nums):
            diff = target - val
            if diff in seen:
                return [seen[diff], i]
            seen[val] = i
        return []`,
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'sub-2',
    questionId: 'q-1',
    userId: 'user-2',
    userName: 'Samira Patel',
    userInitials: 'SP',
    userAvatarColor: 'from-emerald-500 to-teal-600',
    submissionUrl: 'https://leetcode.com/problems/two-sum/submissions/1209418290/',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    timeExplanation: 'Pre-populating lookup map and instant key verification in one traversal.',
    spaceExplanation: 'Hash table size directly proportional to input array length.',
    language: 'C++',
    runtime: '8 ms',
    memory: '13.6 MB',
    approach: 'std::unordered_map one-pass lookup',
    codeSnippet: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (mp.count(comp)) return {mp[comp], i};
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
    submittedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
  {
    id: 'sub-3',
    questionId: 'q-2',
    userId: 'user-2',
    userName: 'Samira Patel',
    userInitials: 'SP',
    userAvatarColor: 'from-emerald-500 to-teal-600',
    submissionUrl: 'https://leetcode.com/problems/trapping-rain-water/submissions/1209501837/',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    timeExplanation: 'Left and right two-pointer scan meeting in the middle in one pass.',
    spaceExplanation: 'Constant additional space for leftMax and rightMax tracking variables.',
    language: 'Python 3',
    runtime: '82 ms',
    memory: '18.9 MB',
    approach: 'Two Pointers converging inward with left_max and right_max',
    codeSnippet: `class Solution:
    def trap(self, height: List[int]) -> int:
        if not height: return 0
        l, r = 0, len(height) - 1
        l_max, r_max = height[l], height[r]
        water = 0
        while l < r:
            if l_max < r_max:
                l += 1
                l_max = max(l_max, height[l])
                water += l_max - height[l]
            else:
                r -= 1
                r_max = max(r_max, height[r])
                water += r_max - height[r]
        return water`,
    submittedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
  },
];

// Persistent state container
let members: GroupMember[] = [...defaultMembers];
let questions: DailyQuestion[] = [...defaultQuestions];
let submissions: QuestionSubmission[] = [...defaultSubmissions];

export function createApiRouter(): express.Router {
  const router = express.Router();
  router.use(express.json({ limit: '10mb' }));

  // GET /api/group-data -> returns members, questions, submissions
  router.get('/group-data', (_req: Request, res: Response) => {
    res.json({
      members,
      questions,
      submissions,
    });
  });

  // POST /api/members -> add new friend to the group
  router.post('/members', (req: Request, res: Response) => {
    try {
      const { name, handle, bio, avatarColor } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Member name is required' });
        return;
      }
      const initials = name
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
      const selectedColor = avatarColor || colorOptions[members.length % colorOptions.length];

      const newMember: GroupMember = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        handle: (handle || name.toLowerCase().replace(/\s+/g, '_')).trim(),
        avatarColor: selectedColor,
        avatarInitials: initials,
        bio: bio || 'Solving algorithms with friends.',
      };

      members.push(newMember);
      res.json({ success: true, member: newMember, members });
    } catch (err: any) {
      console.error('Error adding member:', err);
      res.status(500).json({ error: err.message || 'Failed to add member' });
    }
  });

  // POST /api/parse-problem -> takes LeetCode link / title, uses Gemini to understand problem
  router.post('/parse-problem', async (req: Request, res: Response) => {
    try {
      const { input, targetDate, postedByUserId, postedByUserName } = req.body;
      if (!input || typeof input !== 'string') {
        res.status(400).json({ error: 'LeetCode link or problem name is required' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback parser if API key is not yet set
        const titleMatch = input.replace(/https?:\/\/(www\.)?leetcode\.com\/problems\//, '').replace(/\/.*$/, '').replace(/[-_]/g, ' ');
        const cleanTitle = titleMatch ? titleMatch.charAt(0).toUpperCase() + titleMatch.slice(1) : 'LeetCode Problem';
        const fallbackQuestion: DailyQuestion = {
          id: `q-${Date.now()}`,
          date: targetDate || getTodayDateString(),
          title: cleanTitle,
          slug: input.includes('leetcode.com') ? input.split('/problems/')[1]?.split('/')[0] || 'problem' : 'problem',
          url: input.startsWith('http') ? input : `https://leetcode.com/problems/${input.toLowerCase().replace(/\s+/g, '-')}/`,
          difficulty: 'Medium',
          tags: ['Algorithm'],
          summary: `Daily practice problem: ${cleanTitle}`,
          statement: `Please review the full problem description directly on LeetCode: ${input}`,
          examples: [
            {
              input: 'See LeetCode problem description for test cases',
              output: 'See problem specification',
            },
          ],
          constraints: ['Standard LeetCode constraints apply'],
          useCases: ['Consider standard edge cases such as empty input, single element, and maximum limits.'],
          recommendedComplexity: { time: 'O(n)', space: 'O(1)' },
          postedByUserId: postedByUserId || 'user-1',
          postedByUserName: postedByUserName || 'Friend',
          createdAt: new Date().toISOString(),
        };
        questions.unshift(fallbackQuestion);
        res.json({ success: true, question: fallbackQuestion, questions });
        return;
      }

      // Prompt Gemini to extract detailed LeetCode problem specifications
      const prompt = `You are an expert algorithms coach. The user provides a LeetCode problem link or problem title:
"${input}"

Your task is to analyze and parse this LeetCode question completely. Output a valid, strictly formatted JSON object with no markdown fences, no backticks around the json.

The JSON MUST conform to this exact structure:
{
  "title": "Exact problem title (e.g., 'Two Sum' or 'Longest Substring Without Repeating Characters')",
  "leetcodeNumber": 1,
  "slug": "kebab-case-slug-for-url (e.g. 'two-sum')",
  "canonicalUrl": "https://leetcode.com/problems/slug/",
  "difficulty": "Easy" | "Medium" | "Hard",
  "tags": ["Array", "Hash Table"],
  "summary": "Crisp 1-2 sentence core goal of what needs to be solved.",
  "statement": "Complete, clear problem statement including definitions and rules.",
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9"
  ],
  "useCases": [
    "Key edge case or trick 1 (e.g., negative numbers, empty arrays)",
    "Key edge case 2 (e.g., all duplicates)",
    "Key performance consideration (e.g., must avoid O(n^2) brute force due to n=10^5)"
  ],
  "recommendedComplexity": {
    "time": "O(n)",
    "space": "O(n)"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      let parsedData: any = null;
      try {
        const text = response.text || '{}';
        parsedData = JSON.parse(text);
      } catch (parseErr) {
        console.warn('JSON parse error from Gemini, attempting regex match:', parseErr);
        const match = response.text?.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        }
      }

      if (!parsedData || !parsedData.title) {
        throw new Error('Could not parse problem details from model response');
      }

      const canonicalUrl = input.startsWith('http')
        ? input
        : parsedData.canonicalUrl || `https://leetcode.com/problems/${parsedData.slug || 'problem'}/`;

      const newQuestion: DailyQuestion = {
        id: `q-${Date.now()}`,
        date: targetDate || getTodayDateString(),
        title: parsedData.title,
        leetcodeNumber: parsedData.leetcodeNumber || undefined,
        slug: parsedData.slug || parsedData.title.toLowerCase().replace(/\s+/g, '-'),
        url: canonicalUrl,
        difficulty: ['Easy', 'Medium', 'Hard'].includes(parsedData.difficulty) ? parsedData.difficulty : 'Medium',
        tags: Array.isArray(parsedData.tags) && parsedData.tags.length > 0 ? parsedData.tags : ['Algorithm'],
        summary: parsedData.summary || `Solve ${parsedData.title}`,
        statement: parsedData.statement || `Detailed question for ${parsedData.title}`,
        examples: Array.isArray(parsedData.examples) ? parsedData.examples : [],
        constraints: Array.isArray(parsedData.constraints) ? parsedData.constraints : [],
        useCases: Array.isArray(parsedData.useCases) ? parsedData.useCases : [],
        recommendedComplexity: parsedData.recommendedComplexity || { time: 'O(n)', space: 'O(1)' },
        postedByUserId: postedByUserId || 'user-1',
        postedByUserName: postedByUserName || 'Friend',
        createdAt: new Date().toISOString(),
      };

      questions.unshift(newQuestion);
      res.json({ success: true, question: newQuestion, questions });
    } catch (err: any) {
      console.error('Error parsing problem:', err);
      res.status(500).json({ error: err.message || 'Failed to parse LeetCode problem' });
    }
  });

  // POST /api/analyze-submission -> takes submission URL + optional code, analyzes complexity
  router.post('/analyze-submission', async (req: Request, res: Response) => {
    try {
      const {
        questionId,
        userId,
        userName,
        userInitials,
        userAvatarColor,
        submissionUrl,
        codeSnippet,
      } = req.body;

      if (!questionId || !userId) {
        res.status(400).json({ error: 'questionId and userId are required' });
        return;
      }
      if (!submissionUrl && !codeSnippet) {
        res.status(400).json({ error: 'Please provide either a submission URL or your solution code.' });
        return;
      }

      // Find problem to give context to Gemini
      const problem = questions.find((q) => q.id === questionId);

      const ai = getGeminiClient();
      let analysis = {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        timeExplanation: 'Optimal single pass traversal',
        spaceExplanation: 'Constant extra memory variables',
        language: 'Python 3',
        runtime: '45 ms',
        memory: '16.8 MB',
        approach: 'Optimal standard solution',
        codeSnippet: codeSnippet || '',
      };

      if (ai) {
        const prompt = `You are a strict LeetCode submission evaluator and algorithms expert.
The user has completed a LeetCode problem:
- Problem: "${problem ? problem.title : 'LeetCode Problem'}"
- Submission URL provided: "${submissionUrl || 'N/A'}"
- Solution code snippet (if provided):
\`\`\`
${codeSnippet || 'No code provided directly. Infer from standard optimal solution or URL patterns.'}
\`\`\`

Evaluate this submission. Extract or compute:
1. Time Complexity (Big-O notation, e.g. "O(n)", "O(n log n)", "O(1)")
2. Explanation for Time Complexity (1-2 sentences)
3. Space Complexity (Big-O notation, e.g. "O(1)", "O(n)", "O(k)")
4. Explanation for Space Complexity (1-2 sentences)
5. Programming Language (e.g. "Python 3", "C++", "Java", "TypeScript", "Go", "Rust")
6. Runtime estimate or metric (e.g. "45 ms")
7. Memory estimate or metric (e.g. "16.4 MB")
8. Core algorithmic approach (e.g. "Two Pointers with Left/Right Pointers", "Monotonic Stack", "Hash Map Complement")
9. Clean, formatted solution code snippet (if code was provided or standard solution in that language)

Return strictly a JSON object with this exact shape:
{
  "timeComplexity": "O(n)",
  "timeExplanation": "...",
  "spaceComplexity": "O(1)",
  "spaceExplanation": "...",
  "language": "Python 3",
  "runtime": "...",
  "memory": "...",
  "approach": "...",
  "codeSnippet": "..."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        try {
          const text = response.text || '{}';
          const parsed = JSON.parse(text);
          if (parsed.timeComplexity) {
            analysis = {
              timeComplexity: parsed.timeComplexity,
              spaceComplexity: parsed.spaceComplexity || 'O(1)',
              timeExplanation: parsed.timeExplanation || '',
              spaceExplanation: parsed.spaceExplanation || '',
              language: parsed.language || 'Python 3',
              runtime: parsed.runtime || '45 ms',
              memory: parsed.memory || '16.8 MB',
              approach: parsed.approach || 'Optimal approach',
              codeSnippet: parsed.codeSnippet || codeSnippet || '',
            };
          }
        } catch (e) {
          console.warn('Could not parse Gemini submission analysis JSON:', e);
        }
      }

      // Check if user already submitted this question -> update or insert
      const existingIndex = submissions.findIndex(
        (s) => s.questionId === questionId && s.userId === userId
      );

      const submissionRecord: QuestionSubmission = {
        id: existingIndex >= 0 ? submissions[existingIndex].id : `sub-${Date.now()}`,
        questionId,
        userId,
        userName: userName || 'Friend',
        userInitials: userInitials || 'LC',
        userAvatarColor: userAvatarColor || 'from-blue-500 to-indigo-600',
        submissionUrl: submissionUrl || (problem ? problem.url : 'https://leetcode.com'),
        timeComplexity: analysis.timeComplexity,
        spaceComplexity: analysis.spaceComplexity,
        timeExplanation: analysis.timeExplanation,
        spaceExplanation: analysis.spaceExplanation,
        language: analysis.language,
        runtime: analysis.runtime,
        memory: analysis.memory,
        approach: analysis.approach,
        codeSnippet: analysis.codeSnippet || codeSnippet,
        submittedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        submissions[existingIndex] = submissionRecord;
      } else {
        submissions.push(submissionRecord);
      }

      res.json({
        success: true,
        submission: submissionRecord,
        submissions,
      });
    } catch (err: any) {
      console.error('Error analyzing submission:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze submission' });
    }
  });

  // DELETE /api/questions/:id -> delete a question
  router.delete('/questions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    questions = questions.filter((q) => q.id !== id);
    submissions = submissions.filter((s) => s.questionId !== id);
    res.json({ success: true, questions, submissions });
  });

  return router;
}
