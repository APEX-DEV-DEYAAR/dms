interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface Props {
  stats: StatCard[];
}

export function StatsCards({ stats }: Props) {
  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'total letterheads':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'this month':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'active departments':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="stat-card group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-deyaar-beige rounded-lg text-deyaar-orange group-hover:bg-deyaar-orange group-hover:text-white transition-colors duration-300">
                  {getIcon(stat.title)}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">{stat.title}</div>
              <div className="mt-1 text-3xl font-bold text-deyaar-dark">{stat.value}</div>
              {stat.subtitle && (
                <div className="mt-1 text-xs text-deyaar-brown font-medium">{stat.subtitle}</div>
              )}
            </div>
          </div>
          {/* Decorative accent line */}
          <div className="mt-4 h-1 w-12 bg-gradient-to-r from-deyaar-orange to-deyaar-brown rounded-full group-hover:w-full transition-all duration-500"></div>
        </div>
      ))}
    </div>
  );
}
