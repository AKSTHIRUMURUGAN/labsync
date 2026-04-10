import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { experimentTitle, experimentDescription, customPrompt } = await request.json();

    console.log('Generating observation table with:', { experimentTitle, experimentDescription, customPrompt });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert in creating scientific observation tables for laboratory experiments.

Experiment Title: ${experimentTitle || 'Not provided'}
Experiment Description: ${experimentDescription || 'Not provided'}
Additional Instructions: ${customPrompt || 'None'}

Generate a perfect observation table structure with the following:
1. A descriptive table name
2. Appropriate columns with:
   - Column name (clear and scientific)
   - Type: "input" for measured/independent variables, "output" for calculated/dependent variables
   - Unit (SI units preferred, e.g., m, kg, s, V, A, Ω, °C, etc.)
   - Formula (for output columns only, using input column names as variables)
3. Suggested number of rows (typically 5-10 for experiments)

IMPORTANT FORMULA RULES:
- Use input column names exactly as variables (case-sensitive)
- Available functions: sin, cos, tan, asin, acos, atan, sqrt, pow, log, ln, abs, round, PI, E
- Trigonometric functions use degrees (not radians)
- Examples:
  * Ohm's Law: "Voltage / Current"
  * Power: "Voltage * Current"
  * Kinetic Energy: "0.5 * Mass * pow(Velocity, 2)"
  * Percentage Error: "abs((Measured - Actual) / Actual) * 100"
  * Sine calculation: "sin(Angle)"

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "tableName": "string",
  "columns": [
    {
      "name": "string",
      "type": "input" | "output",
      "unit": "string",
      "formula": "string (only for output columns)"
    }
  ],
  "rowCount": number
}

Example for Ohm's Law experiment:
{
  "tableName": "Voltage-Current Relationship",
  "columns": [
    { "name": "Voltage", "type": "input", "unit": "V" },
    { "name": "Current", "type": "input", "unit": "A" },
    { "name": "Resistance", "type": "output", "unit": "Ω", "formula": "Voltage / Current" },
    { "name": "Power", "type": "output", "unit": "W", "formula": "Voltage * Current" }
  ],
  "rowCount": 6
}`;

    console.log('Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    console.log('Gemini response:', text);

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON
    const tableData = JSON.parse(text);

    console.log('Parsed table data:', tableData);

    // Validate the structure
    if (!tableData.tableName || !tableData.columns || !Array.isArray(tableData.columns)) {
      throw new Error('Invalid table structure from AI');
    }

    return NextResponse.json({
      success: true,
      data: tableData,
    });
  } catch (error) {
    console.error('AI observation table generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate observation table';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
