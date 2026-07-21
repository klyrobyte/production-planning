import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export default function ToastNotification() {
  const toast = useToastStore((state) => state.toast);
  const hideToast = useToastStore((state) => state.hideToast);

  if (!toast) return null;

  const getVariantStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/90 dark:bg-emerald-950/90 border-emerald-500/40 text-white',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
          defaultTitle: 'Berhasil',
        };
      case 'error':
        return {
          bg: 'bg-rose-900/90 dark:bg-rose-950/90 border-rose-500/40 text-white',
          icon: <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />,
          defaultTitle: 'Gagal Operasi',
        };
      case 'warning':
        return {
          bg: 'bg-amber-900/90 dark:bg-amber-950/90 border-amber-500/40 text-white',
          icon: <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
          defaultTitle: 'Peringatan',
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-900/90 dark:bg-sky-950/90 border-sky-500/40 text-white',
          icon: <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />,
          defaultTitle: 'Informasi',
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <div className="fixed top-5 right-5 z-[99999] max-w-sm w-full pointer-events-auto animate-in slide-in-from-top-5 fade-in duration-300">
      <div
        className={`flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-md shadow-2xl ${variant.bg}`}
      >
        {variant.icon}
        <div className="flex-1 text-left min-w-0">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
            {toast.title || variant.defaultTitle}
          </h4>
          <p className="mt-0.5 text-xs font-medium text-slate-200 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>
        <button
          onClick={hideToast}
          className="rounded-lg p-1 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          title="Tutup Notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
