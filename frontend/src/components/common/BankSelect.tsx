import { useEffect, useState } from "react";
import { useBankOptions } from "../../utils/banks";

const OTHER_VALUE = "__other__";

interface BankSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName?: string;
  inputClassName?: string;
}

export default function BankSelect({ value, onChange, selectClassName, inputClassName }: BankSelectProps) {
  const [bankOptions, addBankOption] = useBankOptions();
  const [isOther, setIsOther] = useState(() => Boolean(value) && !bankOptions.includes(value));

  useEffect(() => {
    if (value && !bankOptions.includes(value)) {
      setIsOther(true);
    } else if (!value || bankOptions.includes(value)) {
      setIsOther(false);
    }
  }, [value, bankOptions]);

  return (
    <>
      <select
        value={isOther ? OTHER_VALUE : value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === OTHER_VALUE) {
            setIsOther(true);
            onChange("");
          } else {
            setIsOther(false);
            onChange(next);
          }
        }}
        className={selectClassName}
      >
        <option value="">Select bank</option>
        {bankOptions.map((bank) => (
          <option key={bank} value={bank}>
            {bank}
          </option>
        ))}
        <option value={OTHER_VALUE}>Other</option>
      </select>

      {isOther ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => addBankOption(value)}
          placeholder="Enter bank name"
          className={inputClassName}
        />
      ) : null}
    </>
  );
}
