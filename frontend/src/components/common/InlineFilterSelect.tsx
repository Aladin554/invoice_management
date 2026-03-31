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
        className={`min-w-0 appearance-none bg-transparent pr-0 outline-none ${selectClassName}`}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none size-4 shrink-0 text-slate-400 dark:text-slate-500 ${iconClassName}`}
      />
    </div>
  );
};

export default InlineFilterSelect;
