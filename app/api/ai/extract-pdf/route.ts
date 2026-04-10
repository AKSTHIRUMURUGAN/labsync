import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Save file temporarily
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    tempFilePath = join(tmpdir(), `upload-${Date.now()}.pdf`);
    await writeFile(tempFilePath, buffer);

    // Upload to Gemini
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: 'application/pdf',
      displayName: file.name,
    });

    // Use Gemini to extract and parse content
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are analyzing a laboratory experiment manual PDF. Extract and structure the following information:

1. TITLE: The experiment title
2. AIM: The aim/objective of the experiment
3. APPARATUS: List of equipment/materials needed (as array)
4. THEORY: Theoretical background and formulas
5. PROCEDURE: Step-by-step procedure (as array)
6. OBJECTIVES: Learning objectives (as array)

Return ONLY a valid JSON object with this exact structure:
{
  "title": "experiment title here",
  "description": "brief 2-3 sentence description",
  "aim": "aim statement here",
  "apparatus": ["item 1", "item 2", "item 3"],
  "theory": "theory and formulas here",
  "procedure": ["step 1", "step 2", "step 3"],
  "objectives": ["objective 1", "objective 2", "objective 3"]
}

If any section is not found, use empty string or empty array. Keep content clear and educational.`;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let extractedData;
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse PDF content. Please ensure the PDF contains standard lab manual sections.' },
        { status: 400 }
      );
    }

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: extractedData
    });

  } catch (error: any) {
    console.error('PDF extraction error:', error);
    
    // Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to extract PDF content' 
      },
      { status: 500 }
    );
  }
}
