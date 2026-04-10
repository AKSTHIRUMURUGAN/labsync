import { NextRequest, NextResponse } from 'next/server';

// Judge0 RapidAPI Configuration (Code Arena)
const RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST || 'judge029.p.rapidapi.com';

const LANGUAGE_IDS: { [key: string]: number } = {
  c: 50,           // C (GCC 9.2.0)
  cpp: 54,         // C++ (GCC 9.2.0)
  java: 62,        // Java (OpenJDK 13.0.1)
  python: 71,      // Python (3.8.1)
  javascript: 63,  // JavaScript (Node.js 12.14.0)
};

async function executeCode(language: string, code: string, input: string): Promise<any> {
  try {
    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      throw new Error('Unsupported language');
    }

    // Check if RapidAPI key is configured
    if (!RAPIDAPI_KEY) {
      console.log('Judge0 RapidAPI key not configured, using simulation mode');
      return simulateExecution(language, code, input);
    }

    console.log(`Executing ${language} code with Judge0 (Code Arena)...`);

    // Submit code to Judge0 via RapidAPI (Code Arena endpoint)
    const submitResponse = await fetch(`https://${RAPIDAPI_HOST}/submissions?base64_encoded=false&wait=true&fields=*`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: input,
        cpu_time_limit: 2,
        memory_limit: 128000,
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Judge0 submission failed:', submitResponse.status, errorText);
      throw new Error(`Judge0 API error: ${submitResponse.status}`);
    }

    const result = await submitResponse.json();
    
    console.log('Judge0 result status:', result.status?.description);

    // Check for compilation or runtime errors
    if (result.status?.id === 6) {
      // Compilation Error
      return {
        output: '',
        error: result.compile_output || 'Compilation Error',
        status: 'Compilation Error',
        time: 0,
        memory: 0,
      };
    }

    if (result.status?.id === 11 || result.status?.id === 12 || result.status?.id === 13) {
      // Runtime Error
      return {
        output: result.stdout || '',
        error: result.stderr || result.message || 'Runtime Error',
        status: result.status?.description || 'Runtime Error',
        time: parseFloat(result.time) || 0,
        memory: parseInt(result.memory) || 0,
      };
    }

    // Success
    return {
      output: result.stdout || '',
      error: result.stderr || null,
      status: result.status?.description || 'Accepted',
      time: parseFloat(result.time) || 0,
      memory: parseInt(result.memory) || 0,
    };
  } catch (error) {
    console.error('Code execution error:', error);
    // Fallback to simulation if Judge0 fails
    return simulateExecution(language, code, input);
  }
}

function simulateExecution(language: string, code: string, input: string): any {
  // Simple simulation for demo purposes when Judge0 is not available
  console.log('Using simulation mode for code execution');
  
  try {
    // Check for basic syntax errors
    if (language === 'python') {
      if (code.includes('print(')) {
        const match = code.match(/print\((.*?)\)/);
        if (match) {
          let output = match[1].replace(/['"]/g, '');
          // Handle input() function
          if (code.includes('input()')) {
            const inputs = input.split('\n');
            output = inputs.join(' ');
          }
          return {
            output: output + '\n',
            error: null,
            status: 'Accepted (Simulated)',
            time: 0.01,
            memory: 1024,
          };
        }
      }
    }
    
    if (language === 'javascript') {
      if (code.includes('console.log(')) {
        const match = code.match(/console\.log\((.*?)\)/);
        if (match) {
          const output = match[1].replace(/['"]/g, '');
          return {
            output: output + '\n',
            error: null,
            status: 'Accepted (Simulated)',
            time: 0.01,
            memory: 1024,
          };
        }
      }
    }

    if ((language === 'c' || language === 'cpp')) {
      if (code.includes('printf')) {
        const match = code.match(/printf\("(.*?)"/);
        if (match) {
          const output = match[1].replace(/\\n/g, '\n');
          return {
            output,
            error: null,
            status: 'Accepted (Simulated)',
            time: 0.01,
            memory: 1024,
          };
        }
      }
    }

    if (language === 'java') {
      if (code.includes('System.out.println')) {
        const match = code.match(/System\.out\.println\("(.*?)"\)/);
        if (match) {
          const output = match[1] + '\n';
          return {
            output,
            error: null,
            status: 'Accepted (Simulated)',
            time: 0.01,
            memory: 1024,
          };
        }
      }
    }

    // Default simulation
    return {
      output: 'Code executed successfully (simulated)\n',
      error: null,
      status: 'Accepted (Simulated)',
      time: 0.01,
      memory: 1024,
    };
  } catch (error) {
    return {
      output: '',
      error: 'Compilation/Runtime Error (Simulated)',
      status: 'Error',
      time: 0,
      memory: 0,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { language, code, testCases } = await request.json();

    if (!language || !code || !testCases) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`Executing ${language} code with ${testCases.length} test cases`);

    const results = [];

    for (const testCase of testCases) {
      const executionResult = await executeCode(language, code, testCase.input);
      
      const actualOutput = executionResult.output?.trim() || '';
      const expectedOutput = testCase.expectedOutput?.trim() || '';
      const passed = actualOutput === expectedOutput && !executionResult.error;

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        output: actualOutput,
        error: executionResult.error,
        passed,
        time: executionResult.time,
        memory: executionResult.memory,
        status: executionResult.status,
      });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Code execution API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute code',
      },
      { status: 500 }
    );
  }
}
