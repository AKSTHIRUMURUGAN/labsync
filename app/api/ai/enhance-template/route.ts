import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, aim, apparatus, theory, procedure, objectives, description } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create a comprehensive prompt for enhancement
    const prompt = `You are an expert laboratory instructor. Enhance and improve the following lab experiment content to make it more clear, educational, and professional for college-level students.

CURRENT CONTENT:
Title: ${title || 'Not provided'}
Description: ${description || 'Not provided'}
Aim: ${aim || 'Not provided'}
Apparatus: ${apparatus?.join(', ') || 'Not provided'}
Theory: ${theory || 'Not provided'}
Procedure Steps: ${procedure?.join('; ') || 'Not provided'}
Objectives: ${objectives?.join('; ') || 'Not provided'}

Please provide enhanced content with:
1. A clear, concise DESCRIPTION (2-3 sentences)
2. Improved AIM statement
3. Enhanced THEORY with better explanations
4. Refined OBJECTIVES (3-5 clear learning objectives)
5. SAFETY PRECAUTIONS
6. Expected LEARNING OUTCOMES

Return ONLY a valid JSON object:
{
  "description": "enhanced description",
  "aim": "enhanced aim",
  "theory": "enhanced theory",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "safetyPrecautions": "safety notes",
  "learningOutcomes": "expected outcomes"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from the response
    let enhancedData;
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      enhancedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Fallback: create basic enhanced data
      enhancedData = {
        description: description || `This laboratory experiment focuses on ${title}. Students will learn practical applications through hands-on experimentation.`,
        aim: aim || `To understand and demonstrate the principles of ${title}`,
        theory: theory || 'Theoretical concepts will be explored during the experiment.',
        objectives: objectives || [`Understand ${title}`, 'Apply theoretical knowledge', 'Analyze results'],
        safetyPrecautions: 'Follow standard laboratory safety protocols. Wear appropriate protective equipment.',
        learningOutcomes: 'Students will gain practical experience and theoretical understanding.'
      };
    }

    return NextResponse.json({
      success: true,
      data: enhancedData
    });

  } catch (error: any) {
    console.error('AI Enhancement error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to enhance content with AI' 
      },
      { status: 500 }
    );
  }
}
