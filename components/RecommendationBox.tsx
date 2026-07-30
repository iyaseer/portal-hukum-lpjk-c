export default function RecommendationBox({
  judulTugas,
  langkah,
}: {
  judulTugas?: string;
  langkah: string[];
}) {
  if (!langkah || langkah.length === 0) return null;

  return (
    <div className="card border-primary-200 bg-primary-50/50 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
          ✓
        </div>
        <h3 className="text-sm font-semibold text-primary-900">
          Rekomendasi Langkah Pemenuhan{judulTugas ? ` — ${judulTugas}` : ''}
        </h3>
      </div>
      <ol className="mt-3 space-y-2 pl-1 text-sm text-slate-700">
        {langkah.map((item, idx) => (
          <li key={idx} className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
              {idx + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
