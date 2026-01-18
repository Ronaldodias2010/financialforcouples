import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";
import { getDateFormatByLanguage, getLocaleForLanguage, parseLocalDate } from "@/utils/date";

interface DateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateInput({ 
  value, 
  onChange, 
  placeholder, 
  className,
  disabled = false 
}: DateInputProps) {
  const { language } = useLanguage();
  const [open, setOpen] = React.useState(false);
  
  const dateFormat = getDateFormatByLanguage(language as 'pt' | 'en' | 'es');
  const locale = getLocaleForLanguage(language as 'pt' | 'en' | 'es');
  
  const selectedDate = value ? parseLocalDate(value) : undefined;
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format to YYYY-MM-DD for storage
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
    setOpen(false);
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    // Show format hint based on language
    return language === 'en' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, dateFormat, { locale })
          ) : (
            <span>{getPlaceholder()}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={locale}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
