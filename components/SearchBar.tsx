'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/cari?q=${encodeURIComponent(query)}` : '/cari');
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl gap-2">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari peraturan, misalnya: registrasi SBU, akreditasi asosiasi, penilai ahli..."
        className="input-field flex-1 bg-white"
        aria-label="Kata kunci pencarian"
      />
      <button type="submit" className="btn-primary shrink-0">
        Cari
      </button>
    </form>
  );
}
