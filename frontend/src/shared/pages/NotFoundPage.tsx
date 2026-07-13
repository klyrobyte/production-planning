import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

// Render a clean 404 Not Found error screen with action fallback
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 shadow-md">
          <FileQuestion className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 uppercase">404 - Not Found</h1>
        <p className="mt-3 text-slate-500 text-sm leading-relaxed">
          Halaman yang Anda cari tidak ditemukan atau telah dipindahkan ke lokasi lain.
        </p>
        <div className="mt-8">
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-brand-primary/95 hover:shadow-xl active:scale-95 cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
