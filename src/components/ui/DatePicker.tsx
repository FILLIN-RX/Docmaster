import { DateInput } from "@mantine/dates";
import { Text } from "@mantine/core";
import type { ReactNode } from "react";
import "dayjs/locale/fr";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  icon?: string;
  disabled?: boolean;
  label?: ReactNode;
}

function toDate(v: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, d || 1);
}

function toDateStr(d: Date | string | null): string {
  if (!d) return "";
  if (typeof d === "string") return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePicker({ value, onChange, className, placeholder, icon, disabled, label }: DatePickerProps) {
  const date = toDate(value);

  const handleChange = (d: Date | string | null) => onChange(toDateStr(d));

  return (
    <div>
      {label && <Text fw={500} size="sm" mb={4}>{label}</Text>}
      <div className="relative">
        {icon && (
          <i className={`${icon} absolute left-[13px] top-0 bottom-0 flex items-center text-textMuted text-[13px] pointer-events-none z-10`} />
        )}
        <DateInput
          value={date}
          onChange={handleChange}
          placeholder={placeholder || "Sélectionner une date"}
          locale="fr"
          valueFormat="DD/MM/YYYY"
          clearable
          disabled={disabled}
          className={className}
          classNames={{
            input: `bg-bgMain border-borda text-textMain text-[14px] rounded-xl focus:border-primary ${icon ? "pl-[38px]" : ""}`,
          }}
        />
      </div>
    </div>
  );
}
