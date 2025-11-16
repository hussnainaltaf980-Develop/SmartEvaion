import { Injectable, signal } from '@angular/core';
import { of } from 'rxjs';
import { CodingProblem } from '../models/coding-problem.model';

const MOCK_PROBLEMS: CodingProblem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
};`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
      },
    ],
    testCases: [
      { input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] },
      { input: [[3, 2, 4], 6], expectedOutput: [1, 2] },
      { input: [[3, 3], 6], expectedOutput: [0, 1] },
      { input: [[-1, -5, 2, 10], 9], expectedOutput: [0, 3] },
    ],
    solutionFunctionName: 'twoSum',
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    difficulty: 'Easy',
    description: 'Write a function that reverses a string. The input string is given as an array of characters `s`.',
    constraints: [
        '1 <= s.length <= 10^5',
        's[i] is a printable ascii character.'
    ],
    starterCode: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var reverseString = function(s) {
    // Your code here
};`,
    examples: [
        {
            input: 's = ["h","e","l","l","o"]',
            output: '["o","l","l","e","h"]'
        },
        {
            input: 's = ["H","a","n","n","a","h"]',
            output: '["h","a","n","n","a","H"]'
        }
    ],
    testCases: [
        { input: [['h','e','l','l','o']], expectedOutput: ['o','l','l','e','h'] },
        { input: [['H','a','n','n','a','h']], expectedOutput: ['h','a','n','n','a','H'] },
        { input: [['a']], expectedOutput: ['a'] },
        { input: [['1', '2', '3']], expectedOutput: ['3', '2', '1'] }
    ],
    solutionFunctionName: 'reverseString'
  }
];

@Injectable({
  providedIn: 'root',
})
export class CodingProblemService {
  private problems = signal<CodingProblem[]>(MOCK_PROBLEMS);

  getProblems() {
    return this.problems.asReadonly();
  }

  getProblemById(id: string) {
    return this.problems().find(p => p.id === id) || null;
  }
}
