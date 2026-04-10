import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, instructions } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Experiment title is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert laboratory instructor creating a comprehensive lab manual template.

EXPERIMENT TITLE: ${title}

${instructions ? `ADDITIONAL INSTRUCTIONS: ${instructions}` : ''}

Create a complete, professional laboratory experiment template with the following sections:

1. AIM: Clear, concise statement of the experiment's purpose
2. APPARATUS: List of required equipment and materials (as array)
3. SOFTWARE/HARDWARE: Any software or hardware requirements
4. THEORY: Theoretical background, principles, and relevant formulas
5. PROCEDURE: Detailed step-by-step instructions (as array)
6. OBJECTIVES: 3-5 clear learning objectives (as array)
7. SAFETY PRECAUTIONS: Important safety notes
8. LEARNING OUTCOMES: Expected student outcomes

Make the content:
- Educational and appropriate for college-level students
- Clear and easy to follow
- Technically accurate
- Professional in tone

Return ONLY a valid JSON object with this exact structure:
{
  "aim": "aim statement here",
  "apparatus": ["item 1", "item 2", "item 3"],
  "softwareHardware": "software/hardware requirements here",
  "theory": "theory and formulas here (can include HTML formatting)",
  "procedure": ["step 1", "step 2", "step 3"],
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "safetyPrecautions": "safety precautions here",
  "learningOutcomes": "learning outcomes here"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let templateData;
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      templateData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate template. Please try again.' },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!templateData.aim || !templateData.procedure || templateData.procedure.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Generated template is incomplete. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templateData
    });

  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate template' 
      },
      { status: 500 }
    );
  }
}
