// in app/api/storage/upload/route.ts

import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../../src/server/firebaseAdmin'; 
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const decoded = await verifyIdToken(token);

    const form = await req.formData();
    
  
    const file = form.get('file') as File | null;
    const draftId = form.get('draftId') as string | null;
    const sectionId = form.get('sectionId') as string | null;


    if (!file || !draftId || !sectionId) {
      return NextResponse.json({ error: 'missing file, draftId, or sectionId' }, { status: 400 });
    }

   
    const key = `${decoded.uid}/${draftId}/${sectionId}/${Date.now()}-${file.name}`;
    


    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const serviceRole = (process.env.SUPABASE_SERVICE_ROLE || '').trim();
    if (!supabaseUrl || !serviceRole) {
      const missing = [!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null, !serviceRole ? 'SUPABASE_SERVICE_ROLE' : null].filter(Boolean).join(', ');
      return NextResponse.json({ error: `missing supabase env: ${missing}` }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  
    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from('sop-files')
      .upload(key, new Uint8Array(arrayBuffer), {
        upsert: false,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

   
    return NextResponse.json({ path: key, bucket: 'sop-files', userId: decoded.uid });

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upload failed';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}