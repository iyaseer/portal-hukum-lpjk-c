import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dokumen')
    .select('*, tugas:tugas_id(*)')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('dokumen')
    .update({
      tugas_id: body.tugas_id ?? null,
      judul: body.judul,
      nomor_dokumen: body.nomor_dokumen,
      jenis_peraturan: body.jenis_peraturan,
      tanggal_dokumen: body.tanggal_dokumen || null,
      sumber: body.sumber,
      konten_teks: body.konten_teks,
      langkah_rekomendasi: body.langkah_rekomendasi,
      status_publikasi: body.status_publikasi,
    })
    .eq('id', params.id)
    .select('*, tugas:tugas_id(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();

  // Ambil path file agar juga dihapus dari Storage
  const { data: dokumen } = await admin.from('dokumen').select('file_path').eq('id', params.id).single();

  const { error } = await admin.from('dokumen').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (dokumen?.file_path) {
    await admin.storage.from('dokumen').remove([dokumen.file_path]);
  }

  return NextResponse.json({ ok: true });
}
