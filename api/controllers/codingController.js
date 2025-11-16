const { VM } = require('vm2');

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