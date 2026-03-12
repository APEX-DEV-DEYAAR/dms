interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-sm text-gray-500">
        Page <span className="font-semibold text-deyaar-dark">{page}</span> of{' '}
        <span className="font-semibold text-deyaar-dark">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl 
                     text-gray-700 bg-white border border-gray-200 
                     hover:border-deyaar-orange/30 hover:text-deyaar-orange
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200
                     disabled:hover:text-gray-700 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, i) => (
            p === '...' ? (
              <span key={i} className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <button
                key={i}
                onClick={() => onPageChange(p as number)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                  page === p
                    ? 'bg-deyaar-orange text-white shadow-lg shadow-deyaar-orange/25'
                    : 'text-gray-700 hover:bg-deyaar-beige-light hover:text-deyaar-dark'
                }`}
              >
                {p}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl 
                     text-gray-700 bg-white border border-gray-200 
                     hover:border-deyaar-orange/30 hover:text-deyaar-orange
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200
                     disabled:hover:text-gray-700 transition-all duration-200"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
