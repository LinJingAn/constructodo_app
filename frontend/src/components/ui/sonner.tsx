import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      position="top-right"
      offset={20}
      theme={theme as ToasterProps['theme']}
      expand={false}
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            'group toast group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm group-[.toaster]:min-w-[320px]',
          description: 'group-[.toast]:opacity-90',
          default:
            'group-[.toaster]:bg-white group-[.toaster]:text-slate-800 group-[.toaster]:border-slate-200/80 group-[.toaster]:shadow-slate-200/40',
          success:
            'group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 group-[.toaster]:border-emerald-200 group-[.toaster]:shadow-emerald-100/50',
          error:
            'group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200 group-[.toaster]:shadow-red-100/50',
          warning:
            'group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-200 group-[.toaster]:shadow-amber-100/50',
          info:
            'group-[.toaster]:bg-sky-50 group-[.toaster]:text-sky-900 group-[.toaster]:border-sky-200 group-[.toaster]:shadow-sky-100/50',
          loading:
            'group-[.toaster]:bg-slate-50 group-[.toaster]:text-slate-800 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-slate-200/40',
          closeButton:
            '!right-2 !top-2 rounded-lg border border-slate-200/80 bg-white/90 hover:bg-white',
          actionButton: 'group-[.toast]:bg-amber-500 group-[.toast]:text-white group-[.toast]:rounded-lg',
          cancelButton: 'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 group-[.toast]:rounded-lg',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
