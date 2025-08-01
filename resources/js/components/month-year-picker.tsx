import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

interface MonthYearPickerProps {
  onChange: (date: Date) => void;
}

export const MonthYearPicker = ({ onChange }: MonthYearPickerProps) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);

  useEffect(() => {
    onChange(new Date(year, month - 1));
  }, [year, month]);

  return (
    <div className="flex gap-4 mb-4">
      <div className="w-40">
        <Select value={String(month)} onValueChange={(val) => setMonth(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {months.map((name, index) => (
              <SelectItem key={index} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-28">
        <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
