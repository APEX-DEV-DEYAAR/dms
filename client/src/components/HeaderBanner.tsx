interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function HeaderBanner({ title, subtitle, action }: Props) {
  return (
    <div className="bg-gradient-to-r from-deyaar-orange to-deyaar-brown rounded-2xl p-6 text-white shadow-lg shadow-deyaar-orange/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
        </div>
        {action && (
          <div>{action}</div>
        )}
      </div>
    </div>
  );
}
