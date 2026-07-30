import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('tugas').select('*').order('urutan', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('tugas')
    .insert({
      urutan: body.urutan ?? 0,
      slug: body.slug,
      judul: body.judul,
      deskripsi: body.deskripsi ?? '',
      dasar_hukum: body.dasar_hukum ?? '',
      kata_kunci: body.kata_kunci ?? [],
      langkah_rekomendasi: body.langkah_rekomendasi ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
