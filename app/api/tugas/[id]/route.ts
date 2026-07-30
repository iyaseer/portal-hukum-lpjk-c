import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('tugas')
    .update({
      urutan: body.urutan,
      slug: body.slug,
      judul: body.judul,
      deskripsi: body.deskripsi,
      dasar_hukum: body.dasar_hukum,
      kata_kunci: body.kata_kunci,
      langkah_rekomendasi: body.langkah_rekomendasi,
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { error } = await admin.from('tugas').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
