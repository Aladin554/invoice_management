import { ChevronDown } from "lucide-react";
import { SelectHTMLAttributes } from "react";

type InlineFilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
  selectClassName?: string;
  iconClassName?: string;
};

const InlineFilterSelect: React.FC<InlineFilterSelectProps> = ({
  containerClassName = "",
  selectClassName = "",
  iconClassName = "",
  children,
  ...props
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${containerClassName}`}>
      <select
        {...props}
        className={`inline-filter-select h-full min-w-0 flex-1 border-0 bg-transparent pr-0 text-right outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 ${selectClassName}`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none size-4 shrink-0 text-slate-400 dark:text-slate-500 ${iconClassName}`}
      />
    </div>
  );
};

export default InlineFilterSelect;
