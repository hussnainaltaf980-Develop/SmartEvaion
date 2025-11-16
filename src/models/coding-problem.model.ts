export interface TestCase {
  input: any[];
  expectedOutput: any;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string[];
  starterCode: string;
  examples: { input: string; output: string; explanation?: string }[];
  testCases: TestCase[];
  solutionFunctionName: string;
}

export interface TestCaseResult {
    testCaseIndex: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    error?: string;
}

export interface SubmissionResult {
  success: boolean;
  message: string;
  results: TestCaseResult[];
  executionTime?: number;
  memoryUsage?: number;
}
