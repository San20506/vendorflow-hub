import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, RotateCcw, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface GlobalDateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function GlobalDateFilter({ value, onChange, className }: GlobalDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(value.to);

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      setOpen(false);
    }
  };

  const handleReset = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
    onChange({ from: undefined, to: undefined });
    setOpen(false);
  };

  const hasRange = value.from && value.to;
  const label = hasRange
    ? `${format(value.from!, 'dd MMM')} – ${format(value.to!, 'dd MMM yyyy')}`
    : 'Select Date Range';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'gap-2 font-normal transition-all duration-200',
            !hasRange && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="w-4 h-4 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">From Date – To Date</p>
          <div className="flex gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From</p>
              <Calendar
                mode="single"
                selected={tempFrom}
                onSelect={setTempFrom}
                className={cn('p-2 pointer-events-auto')}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To</p>
              <Calendar
                mode="single"
                selected={tempTo}
                onSelect={setTempTo}
                disabled={(date) => (tempFrom ? date < tempFrom : false)}
                className={cn('p-2 pointer-events-auto')}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              disabled={!tempFrom || !tempTo}
              onClick={handleApply}
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
