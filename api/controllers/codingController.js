
const { VM } = require('vm2');

const PROBLEMS_DATA = [
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

exports.getProblems = (req, res) => {
    // In a real scenario, this would fetch from DB
    res.json(PROBLEMS_DATA);
};

exports.executeCode = (req, res) => {
    const { code, testCases, functionName } = req.body;

    const results = [];
    let overallSuccess = true;

    try {
        // Find the user's function definition in their code.
        // This regex handles `var fn = function(...)` and `function fn(...)` formats.
        const functionRegex = new RegExp(`(var|let|const|function)\\s+${functionName}\\s*=\\s*function\\s*\\(.*?\\)\\s*{[\\s\\S]*?}|function\\s+${functionName}\\s*\\(.*?\\)\\s*{[\\s\\S]*?}`, 'm');
        const match = code.match(functionRegex);
        if (!match) {
          throw new Error(`Function '${functionName}' not found in your code.`);
        }
        const userFunctionCode = match[0];

        for (const [index, testCase] of testCases.entries()) {
            const sandbox = {};
            const vm = new VM({
                timeout: 2000, // 2 seconds timeout per test case
                sandbox: sandbox
            });

            // Deep copy input to prevent mutation across test cases
            const inputCopy = JSON.parse(JSON.stringify(testCase.input));
            
            try {
                // Define the function in the VM's global scope
                vm.run(userFunctionCode);

                // Prepare arguments and the function call string dynamically
                const argNames = [];
                inputCopy.forEach((arg, i) => {
                    const argName = `arg${i}`;
                    sandbox[argName] = arg;
                    argNames.push(argName);
                });

                const functionCall = `${functionName}(${argNames.join(', ')})`;
                const actualOutput = vm.run(functionCall);
                
                // If the function returned undefined (e.g., in-place modification), 
                // the result is the (potentially modified) first argument.
                const finalOutput = actualOutput === undefined ? sandbox.arg0 : actualOutput;
                
                let passed;
                // Special case for 'two-sum' where order of indices doesn't matter
                if (functionName === 'twoSum' && Array.isArray(finalOutput) && Array.isArray(testCase.expectedOutput)) {
                    const sortedActual = [...finalOutput].sort((a,b) => a-b);
                    const sortedExpected = [...testCase.expectedOutput].sort((a,b) => a-b);
                    passed = JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
                } else {
                    passed = JSON.stringify(finalOutput) === JSON.stringify(testCase.expectedOutput);
                }
                
                if (!passed) overallSuccess = false;

                results.push({
                    testCaseIndex: index,
                    input: JSON.stringify(testCase.input),
                    expected: JSON.stringify(testCase.expectedOutput),
                    actual: JSON.stringify(finalOutput),
                    passed: passed,
                });
            } catch (e) {
                overallSuccess = false;
                results.push({
                    testCaseIndex: index,
                    input: JSON.stringify(testCase.input),
                    expected: JSON.stringify(testCase.expectedOutput),
                    actual: 'Runtime Error',
                    passed: false,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        res.json({ success: overallSuccess, message: 'Execution completed', results });

    } catch (e) {
        // This catches errors like the function not being found or other pre-execution issues.
        res.status(400).json({
            success: false,
            message: e instanceof Error ? `Compilation Error: ${e.message}` : 'An unknown compilation error occurred.',
            results: [],
        });
    }
};
