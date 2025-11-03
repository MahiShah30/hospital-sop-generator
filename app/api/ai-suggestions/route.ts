import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyIdToken, getAdminDb } from '../../../src/server/firebaseAdmin';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/firebase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { draftId } = await request.json();

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    // Fetch draft data
    const draftRef = doc(db, 'users', userId, 'sopDrafts', draftId);
    const draftSnap = await getDoc(draftRef);

    if (!draftSnap.exists()) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draftData = draftSnap.data();

    // Collect completed sections data
    const sectionsData = [];
    if (draftData.sections) {
      for (const [sectionId, completed] of Object.entries(draftData.sections)) {
        if (completed) {
          const sectionRef = doc(db, 'users', userId, 'sopDrafts', draftId, 'sections', sectionId);
          const sectionSnap = await getDoc(sectionRef);
          if (sectionSnap.exists()) {
            sectionsData.push({
              sectionId,
              data: sectionSnap.data().answers || {}
            });
          }
        }
      }
    }

    // Generate AI suggestions based on completed sections
    const prompt = `You are an expert healthcare consultant specializing in Standard Operating Procedures (SOPs) for hospitals. Based on the following completed sections of an SOP draft, provide 3-5 specific, actionable suggestions to improve the SOP. Focus on:

1. Compliance with healthcare standards (NABH, JCI, etc.)
2. Patient safety and quality improvement
3. Operational efficiency
4. Risk management
5. Documentation completeness

Completed sections data:
${JSON.stringify(sectionsData, null, 2)}

Provide suggestions in a concise, bullet-point format. Each suggestion should be specific and actionable.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare SOP expert providing improvement suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const suggestions = completion.choices[0]?.message?.content?.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')) || [];

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
