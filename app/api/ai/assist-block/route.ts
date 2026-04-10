import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, prompt, blockType } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    if (!content || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Content and prompt are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create context-aware prompt
    const systemPrompt = blockType === 'text' 
      ? `You are an expert content editor for laboratory manuals. The user will provide content and a request. 
Your task is to modify the content according to their request while maintaining educational quality and clarity.

IMPORTANT: 
- If the content is HTML, return HTML
- If the content is plain text, return plain text
- Keep the same format as the input
- Be concise and professional
- Focus on educational content for college-level students

Current content:
${content}

User request: ${prompt}

Provide ONLY the improved content without any explanations or markdown formatting.`
      : `You are an expert content editor for laboratory manuals. The user will provide a heading/title and a request.
Your task is to modify the heading according to their request.

Current heading: ${content}

User request: ${prompt}

Provide ONLY the improved heading text without any explanations, quotes, or markdown.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text().trim();

    // Clean up the response
    let cleanedContent = text;
    
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    
    // Remove quotes if it's a heading
    if (blockType === 'heading') {
      cleanedContent = cleanedContent.replace(/^["']|["']$/g, '');
    }

    return NextResponse.json({
      success: true,
      data: {
        content: cleanedContent
      }
    });

  } catch (error: any) {
    console.error('AI Block Assistant error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process AI request' 
      },
      { status: 500 }
    );
  }
}
