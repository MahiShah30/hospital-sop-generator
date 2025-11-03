import { NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "../../../../../src/server/firebaseAdmin";
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function POST(request: Request, { params }: { params: { draftId: string } }) {

  console.log("SERVER CHECK: Project ID is:", process.env.FIREBASE_PROJECT_ID);

  try {
    const token = getToken(request);
    console.log("Server received token (first 30 chars):", token.substring(0, 30));
    const decoded = await verifyIdToken(token);
    const db = getAdminDb();
    const draftRef = db.collection('users').doc(decoded.uid).collection('sopDrafts').doc(params.draftId);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) return NextResponse.json({ error: 'draft not found' }, { status: 404 });

    const sectionsSnap = await draftRef.collection('sections').get();
    const sections: Record<string, any> = {};
    sectionsSnap.forEach(doc => { sections[doc.id] = doc.data(); });

    // 1) Build HTML from sections (very simple stub; can be themed)
    const html = buildHtmlFromSections(draftSnap.data() as any, sections);

    // 2) Render PDF with puppeteer (assumes chromium available in env; for local dev use installed Chrome path)
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 3) Upload to Supabase private bucket
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE as string, { auth: { persistSession: false } });
    const key = `users/${decoded.uid}/drafts/${params.draftId}/sop_${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage.from('sop-files').upload(key, pdfBuffer, { contentType: 'application/pdf', upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    // 4) Create signed URL
    const { data: signed, error: signErr } = await supabase.storage.from('sop-files').createSignedUrl(key, 3600);
    if (signErr) return NextResponse.json({ error: signErr.message }, { status: 400 });

    // 5) Save version metadata
    await draftRef.set({ lastCompiledAt: new Date(), lastOutput: { bucket: 'sop-files', path: key, format: 'pdf' } }, { merge: true });

    return NextResponse.json({ url: signed.signedUrl, path: key });
  } catch (e) {
    console.error("Error in compile route:", e.message);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("no token");
  return token;
}

function esc(str: string) {
  return String(str ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

function buildHtmlFromSections(draft: any, sections: Record<string, any>) {
  const title = esc(draft?.title || 'Standard Operating Procedure');
  let body = `<h1>${title}</h1>`;
  const keys = Object.keys(sections);

  // Sections to exclude from PDF generation
  const excludedSections = ['responsibilities-contacts', 'references-version-control'];

  // Mapping for section keys to proper titles
  const sectionTitleMap: Record<string, string> = {
    'hospital-info': 'Hospital Info',
    'document-metadata': 'Document Metadata',
    'control-distribution': 'Control & Distribution',
    'purpose-scope': 'Purpose & Scope',
    'policies-procedures': 'Policies & Procedures',
    'quality-kpis': 'Quality & KPIs',
    'training-compliance': 'Training & Compliance',
    'layout-branding': 'Layout & Branding',
    'summary-closure': 'Summary & Closure'
  };

  for (const k of keys) {
    // Skip excluded sections
    if (excludedSections.includes(k)) continue;

    const sec = sections[k];
    const sectionTitle = sectionTitleMap[k] || sec?.title || k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    body += `<h2>${esc(sectionTitle)}</h2>`;
    const answers = sec?.answers || {};
    body += renderSectionContent(k, answers);
  }
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    body { font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 20px; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { font-size: 22px; margin-top: 30px; margin-bottom: 15px; color: #555; border-left: 4px solid #007bff; padding-left: 10px; }
    h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #666; }
    p { margin-bottom: 10px; }
    ul { margin-left: 20px; margin-bottom: 15px; }
    li { margin-bottom: 5px; }
    .field { margin-bottom: 15px; }
    .field-label { font-weight: bold; color: #333; }
    .field-value { margin-left: 10px; }
    .repeater-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    .repeater-item h4 { margin-top: 0; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
  </style></head><body>${body}</body></html>`;
}

function renderSectionContent(sectionKey: string, answers: any) {
  let content = '';
  for (const [fieldName, value] of Object.entries(answers)) {
    if (value === null || value === undefined || value === '') continue;
    const fieldLabel = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    content += `<div class="field"><span class="field-label">${esc(fieldLabel)}:</span>`;

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        // Repeater field - render as table
        content += '<table>';
        const headers = Object.keys(value[0]);
        content += '<tr>' + headers.map(h => `<th>${esc(h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))}</th>`).join('') + '</tr>';
        for (const item of value) {
          content += '<tr>' + headers.map(h => `<td>${esc(String(item[h] || ''))}</td>`).join('') + '</tr>';
        }
        content += '</table>';
      } else {
        // Simple array - render as list
        content += '<ul>' + value.map(v => `<li>${esc(String(v))}</li>`).join('') + '</ul>';
      }
    } else if (typeof value === 'object') {
      // Object - render as key-value pairs
      content += '<div class="repeater-item">';
      for (const [k, v] of Object.entries(value)) {
        const keyLabel = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        content += `<div><strong>${esc(keyLabel)}:</strong> ${esc(String(v))}</div>`;
      }
      content += '</div>';
    } else {
      // Simple value
      content += ` <span class="field-value">${esc(String(value))}</span>`;
    }
    content += '</div>';
  }
  return content;
}


