// src/components/ui/date-time-picker.tsx
'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateTimePickerProps {
  value?: string; // YYYY-MM-DDTHH:mm or ISO string
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
  hasError?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Common minute intervals for quick selection
const MINUTES_LIST = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const HOURS_LIST = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Format a Date to local YYYY-MM-DDTHH:mm string
 */
function toLocalDatetimeString(d: Date): string {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time...',
  disabled = false,
  minDate,
  className,
  hasError = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse incoming value or fallback to null
  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Current view month & year (for calendar paging)
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    return parsedDate || new Date();
  });

  // Selected date components
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(() => parsedDate);

  // Time components (12-hour display)
  const initialHours = parsedDate ? parsedDate.getHours() : 12;
  const initialPeriod: 'AM' | 'PM' = initialHours >= 12 ? 'PM' : 'AM';
  const initialHour12 = initialHours % 12 === 0 ? 12 : initialHours % 12;
  const initialMinutes = parsedDate ? parsedDate.getMinutes() : 0;

  const [hour12, setHour12] = React.useState<number>(initialHour12);
  const [minute, setMinute] = React.useState<number>(initialMinutes);
  const [period, setPeriod] = React.useState<'AM' | 'PM'>(initialPeriod);

  // Sync internal state when external value changes
  React.useEffect(() => {
    if (parsedDate) {
      setSelectedDay(parsedDate);
      setViewDate(parsedDate);
      const h = parsedDate.getHours();
      setPeriod(h >= 12 ? 'PM' : 'AM');
      setHour12(h % 12 === 0 ? 12 : h % 12);
      setMinute(parsedDate.getMinutes());
    } else {
      setSelectedDay(null);
    }
  }, [parsedDate]);

  // Close popup on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Emit updated date-time string
  const emitChange = (day: Date, h12: number, min: number, ampm: 'AM' | 'PM') => {
    let hours24 = h12 % 12;
    if (ampm === 'PM') hours24 += 12;

    const result = new Date(day);
    result.setHours(hours24, min, 0, 0);

    const formatted = toLocalDatetimeString(result);
    onChange?.(formatted);
  };

  // Handle day click
  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    emitChange(day, hour12, minute, period);
  };

  // Handle hour selection
  const handleSelectHour = (newHour: number) => {
    setHour12(newHour);
    const baseDay = selectedDay || new Date();
    setSelectedDay(baseDay);
    emitChange(baseDay, newHour, minute, period);
  };

  // Handle minute selection
  const handleSelectMinute = (newMin: number) => {
    setMinute(newMin);
    const baseDay = selectedDay || new Date();
    setSelectedDay(baseDay);
    emitChange(baseDay, hour12, newMin, period);
  };

  // Handle AM/PM toggle
  const handleSelectPeriod = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    const baseDay = selectedDay || new Date();
    setSelectedDay(baseDay);
    emitChange(baseDay, hour12, minute, newPeriod);
  };

  // Navigation handlers
  const prevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Presets
  const applyPreset = (offsetHours: number) => {
    const target = new Date(Date.now() + offsetHours * 3600000);
    // Round to nearest 5 minutes
    const remainder = target.getMinutes() % 5;
    if (remainder !== 0) {
      target.setMinutes(target.getMinutes() + (5 - remainder));
    }
    target.setSeconds(0, 0);

    setSelectedDay(target);
    setViewDate(target);
    const h = target.getHours();
    setPeriod(h >= 12 ? 'PM' : 'AM');
    setHour12(h % 12 === 0 ? 12 : h % 12);
    setMinute(target.getMinutes());

    onChange?.(toLocalDatetimeString(target));
  };

  const applyTomorrowMorning = () => {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);

    setSelectedDay(target);
    setViewDate(target);
    setPeriod('AM');
    setHour12(9);
    setMinute(0);

    onChange?.(toLocalDatetimeString(target));
  };

  const applyTomorrowEvening = () => {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(18, 0, 0, 0);

    setSelectedDay(target);
    setViewDate(target);
    setPeriod('PM');
    setHour12(6);
    setMinute(0);

    onChange?.(toLocalDatetimeString(target));
  };

  // Calendar days grid computation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = React.useMemo(() => {
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete weeks (42 cells = 6 rows)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month, firstDayIndex, daysInMonth, daysInPrevMonth]);

  // Formatted trigger label
  const formattedDisplay = React.useMemo(() => {
    if (!selectedDay) return null;
    try {
      const monthStr = MONTH_NAMES[selectedDay.getMonth()].slice(0, 3);
      const dayNum = selectedDay.getDate();
      const yr = selectedDay.getFullYear();
      const timeStr = `${hour12}:${pad(minute)} ${period}`;
      return `${monthStr} ${dayNum}, ${yr} at ${timeStr}`;
    } catch {
      return null;
    }
  }, [selectedDay, hour12, minute, period]);

  const now = new Date();
  const isPastDate = (d: Date) => {
    if (minDate) {
      return d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    }
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d < today;
  };

  const isToday = (d: Date) => {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isSelected = (d: Date) => {
    if (!selectedDay) return false;
    return (
      d.getDate() === selectedDay.getDate() &&
      d.getMonth() === selectedDay.getMonth() &&
      d.getFullYear() === selectedDay.getFullYear()
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Shadcn-styled Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full h-11 px-4 py-2.5 bg-[#FAF7F5] border border-[#EDE4E1] rounded-2xl',
          'flex items-center justify-between text-left text-sm text-[#231817]',
          'transition-all duration-200 cursor-pointer outline-none select-none',
          'hover:border-[#FFD5CC] hover:bg-[#FFF5F3]/50',
          'focus:border-[#FF644E] focus:ring-2 focus:ring-[#FF644E]/20',
          hasError && 'border-rose-300 focus:border-rose-400 focus:ring-rose-200',
          isOpen && 'border-[#FF644E] ring-2 ring-[#FF644E]/20 bg-white',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className="w-4 h-4 text-[#FF644E] shrink-0" />
          {formattedDisplay ? (
            <span className="font-semibold text-[#231817] truncate">{formattedDisplay}</span>
          ) : (
            <span className="text-[#9A8785]">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#9A8785] shrink-0">
          <Clock className="w-3.5 h-3.5 text-[#FF644E]" />
          <span className="hidden sm:inline font-mono font-medium">
            {hour12}:{pad(minute)} {period}
          </span>
        </div>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-[calc(100%+0.5rem)] z-50',
            'w-full sm:w-auto min-w-[320px] sm:min-w-[500px]',
            'bg-white rounded-3xl border border-[#EDE4E1] shadow-2xl p-4 sm:p-5',
            'dropdown-content-animate no-scrollbar'
          )}
        >
          {/* Main Content: Calendar + Time Picker */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Left Column: Shadcn Calendar */}
            <div className="flex-1 min-w-[260px]">
              {/* Month & Navigation Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-bold text-sm text-[#231817]">
                  {MONTH_NAMES[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                {WEEKDAY_NAMES.map((wd) => (
                  <div
                    key={wd}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#9A8785] py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const past = isPastDate(cell.date);
                  const selected = isSelected(cell.date);
                  const today = isToday(cell.date);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={past}
                      onClick={() => handleSelectDay(cell.date)}
                      className={cn(
                        'h-8 w-8 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer',
                        !cell.isCurrentMonth && 'text-[#9A8785]/50',
                        cell.isCurrentMonth && !selected && 'text-[#231817] hover:bg-[#FFF5F3] hover:text-[#FF644E]',
                        today && !selected && 'border border-[#FF644E] text-[#FF644E] font-bold',
                        selected && 'bg-[#FF644E] text-white font-bold shadow-md shadow-[#FF644E]/25 hover:bg-[#F04730]',
                        past && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-inherit'
                      )}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Today shortcut */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EDE4E1] text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectDay(new Date())}
                  className="text-[#FF644E] hover:text-[#F04730] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Today
                </button>
                {selectedDay && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(null);
                      onChange?.('');
                    }}
                    className="text-[#9A8785] hover:text-[#231817] font-semibold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-[#EDE4E1] self-stretch" />

            {/* Right Column: Time Picker */}
            <div className="w-full sm:w-44 flex flex-col justify-between pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EDE4E1]">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#786665] mb-2 px-1">
                  <Clock className="w-3.5 h-3.5 text-[#FF644E]" />
                  <span>Delivery Time</span>
                </div>

                {/* AM / PM Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF7F5] rounded-xl border border-[#EDE4E1] mb-3">
                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('AM')}
                    className={cn(
                      'py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                      period === 'AM'
                        ? 'bg-[#FF644E] text-white shadow-xs'
                        : 'text-[#786665] hover:text-[#231817]'
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('PM')}
                    className={cn(
                      'py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                      period === 'PM'
                        ? 'bg-[#FF644E] text-white shadow-xs'
                        : 'text-[#786665] hover:text-[#231817]'
                    )}
                  >
                    PM
                  </button>
                </div>

                {/* Time Selection Columns */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  {/* Hours Column */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A8785] block mb-1">
                      Hour
                    </span>
                    <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1 p-1 bg-[#FAF7F5] rounded-xl border border-[#EDE4E1]">
                      {HOURS_LIST.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleSelectHour(h)}
                          className={cn(
                            'w-full py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                            hour12 === h
                              ? 'bg-[#FF644E] text-white font-bold shadow-xs'
                              : 'text-[#231817] hover:bg-[#FFF5F3] hover:text-[#FF644E]'
                          )}
                        >
                          {pad(h)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minutes Column */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A8785] block mb-1">
                      Minute
                    </span>
                    <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1 p-1 bg-[#FAF7F5] rounded-xl border border-[#EDE4E1]">
                      {MINUTES_LIST.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleSelectMinute(m)}
                          className={cn(
                            'w-full py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                            minute === m
                              ? 'bg-[#FF644E] text-white font-bold shadow-xs'
                              : 'text-[#231817] hover:bg-[#FFF5F3] hover:text-[#FF644E]'
                          )}
                        >
                          {pad(m)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Done button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-3 w-full py-2 bg-[#231817] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Time
              </button>
            </div>
          </div>

          {/* Quick Presets Row */}
          <div className="mt-4 pt-3 border-t border-[#EDE4E1] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A8785] flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-[#FF644E]" />
              Quick:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className="px-2.5 py-1 rounded-full bg-[#FAF7F5] hover:bg-[#FFF5F3] border border-[#EDE4E1] hover:border-[#FFD5CC] text-[11px] font-semibold text-[#786665] hover:text-[#FF644E] transition-colors cursor-pointer"
            >
              +1 Hour
            </button>
            <button
              type="button"
              onClick={() => applyPreset(3)}
              className="px-2.5 py-1 rounded-full bg-[#FAF7F5] hover:bg-[#FFF5F3] border border-[#EDE4E1] hover:border-[#FFD5CC] text-[11px] font-semibold text-[#786665] hover:text-[#FF644E] transition-colors cursor-pointer"
            >
              +3 Hours
            </button>
            <button
              type="button"
              onClick={applyTomorrowMorning}
              className="px-2.5 py-1 rounded-full bg-[#FAF7F5] hover:bg-[#FFF5F3] border border-[#EDE4E1] hover:border-[#FFD5CC] text-[11px] font-semibold text-[#786665] hover:text-[#FF644E] transition-colors cursor-pointer"
            >
              Tomorrow 9 AM
            </button>
            <button
              type="button"
              onClick={applyTomorrowEvening}
              className="px-2.5 py-1 rounded-full bg-[#FAF7F5] hover:bg-[#FFF5F3] border border-[#EDE4E1] hover:border-[#FFD5CC] text-[11px] font-semibold text-[#786665] hover:text-[#FF644E] transition-colors cursor-pointer"
            >
              Tomorrow 6 PM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
