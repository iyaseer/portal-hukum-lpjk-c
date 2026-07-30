import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tugasSlug = searchParams.get('tugas');
  const status = searchParams.get('status'); // dipakai admin untuk lihat draft juga
  const supabase = createClient();

  let query = supabase
    .from('dokumen')
    .select('*, tugas:tugas_id(*)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status_publikasi', status);
  }

  if (tugasSlug) {
    const { data: tugas } = await supabase.from('tugas').select('id').eq('slug', tugasSlug).single();
    if (tugas) {
      query = query.eq('tugas_id', tugas.id);
    } else {
      return NextResponse.json({ data: [] });
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const admin = createAdminClient();

  const wajib = ['judul', 'file_path', 'file_url', 'jenis_file'];
  for (const field of wajib) {
    if (!body[field]) {
      return NextResponse.json({ error: `Field "${field}" wajib diisi.` }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from('dokumen')
    .insert({
      tugas_id: body.tugas_id || null,
      judul: body.judul,
      nomor_dokumen: body.nomor_dokumen || '',
      jenis_peraturan: body.jenis_peraturan || '',
      tanggal_dokumen: body.tanggal_dokumen || null,
      sumber: body.sumber || '',
      jenis_file: body.jenis_file,
      file_path: body.file_path,
      file_url: body.file_url,
      ukuran_file: body.ukuran_file || 0,
      konten_teks: body.konten_teks || '',
      langkah_rekomendasi: body.langkah_rekomendasi || [],
      status_publikasi: body.status_publikasi || 'terbit',
    })
    .select('*, tugas:tugas_id(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
