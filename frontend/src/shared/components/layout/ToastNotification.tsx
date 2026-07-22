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
          bg: 'bg-slate-900/95 dark:bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-950/20',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
          progressBg: 'bg-emerald-500',
          defaultTitle: 'Berhasil',
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 dark:bg-slate-900/95 border-rose-500/50 text-white shadow-rose-950/20',
          icon: <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />,
          progressBg: 'bg-rose-500',
          defaultTitle: 'Gagal Operasi',
        };
      case 'warning':
        return {
          bg: 'bg-slate-900/95 dark:bg-slate-900/95 border-amber-500/50 text-white shadow-amber-950/20',
          icon: <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
          progressBg: 'bg-amber-500',
          defaultTitle: 'Peringatan',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 dark:bg-slate-900/95 border-sky-500/50 text-white shadow-sky-950/20',
          icon: <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />,
          progressBg: 'bg-sky-500',
          defaultTitle: 'Informasi',
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <div
      key={toast.id}
      className="fixed bottom-5 left-4 right-4 sm:bottom-auto sm:top-5 sm:right-5 sm:left-auto sm:max-w-sm w-auto sm:w-full z-[99999] pointer-events-auto toast-animate-in"
    >
      <div
        className={`relative overflow-hidden flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${variant.bg}`}
      >
        {variant.icon}
        <div className="flex-1 text-left min-w-0 pr-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
            {toast.title || variant.defaultTitle}
          </h4>
          <p className="mt-0.5 text-xs font-medium text-slate-300 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>
        <button
          onClick={hideToast}
          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          title="Tutup Notifikasi"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Animated Countdown Progress Bar */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20">
          <div className={`h-full toast-progress-bar ${variant.progressBg}`} />
        </div>
      </div>
    </div>
  );
}
