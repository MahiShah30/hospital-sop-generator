import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../src/server/firebaseAdmin';
import { getSupabaseAdmin } from '../../../src/server/supabaseAdmin';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user (your existing logic is correct)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const decoded = await verifyIdToken(token);
    const userId = decoded.uid;

    // 2. Parse the multipart/form-data payload
    const formData = await request.formData();

    // 3. Extract the file and other metadata from the form data
    const file = formData.get('file') as File | null;
    const draftId = formData.get('draftId') as string | null;
    const sectionId = formData.get('sectionId') as string | null;

    if (!file || !draftId || !sectionId) {
      return NextResponse.json({ error: 'Missing file, draftId, or sectionId in form data' }, { status: 400 });
    }

    // 4. Prepare the file for upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.replace(/\s+/g, '_');
    const key = `users/${userId}/drafts/${draftId}/sections/${sectionId}/${Date.now()}_${fileName}`;
    
    // 5. Get the Supabase admin client and perform the upload
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('sop-files') // Make sure this is your bucket name
      .upload(key, buffer, {
        contentType: file.type || 'application/octet-stream',
      });

    if (error) {
      // If Supabase fails, return a server error
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 6. Return a success response with the uploaded path
    return NextResponse.json({ success: true, path: data.path }, { status: 200 });

  } catch (e: any) {
    // This will now primarily catch authentication errors
    console.error('API Route Error:', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


