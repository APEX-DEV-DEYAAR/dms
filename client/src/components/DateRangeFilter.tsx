interface Props {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="date"
          value={startDate}
          onChange={e => onStartDateChange(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none 
                     focus:ring-2 focus:ring-deyaar-orange/20 focus:border-deyaar-orange
                     bg-white transition-all duration-200"
          placeholder="Start Date"
        />
      </div>
      <span className="text-gray-400 font-medium">→</span>
      <div className="relative">
        <input
          type="date"
          value={endDate}
          onChange={e => onEndDateChange(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none 
                     focus:ring-2 focus:ring-deyaar-orange/20 focus:border-deyaar-orange
                     bg-white transition-all duration-200"
          placeholder="End Date"
        />
      </div>
    </div>
  );
}
