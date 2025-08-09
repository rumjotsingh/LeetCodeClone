"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  format,
  subDays,
  eachDayOfInterval,
  getMonth,
  getYear,
  isSameMonth,
} from "date-fns";

export default function CalendarHeatmap({ data = {} }) {
  const today = new Date();
  const startDate = subDays(today, 364); // 52 weeks + 1 day
  const days = eachDayOfInterval({ start: startDate, end: today });

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Month labels
  const monthLabels = [];
  let lastMonth = null;
  weeks.forEach((week) => {
    const firstDay = week[0];
    const month = getMonth(firstDay);
    const year = getYear(firstDay);
    if (month !== lastMonth) {
      monthLabels.push({
        label: format(firstDay, "MMM"),
        key: `${month}-${year}`,
      });
      lastMonth = month;
    } else {
      monthLabels.push(null);
    }
  });

  // Function for coloring blocks
  const colorScale = (val) => {
    if (val >= 10) return "bg-green-700";
    if (val >= 5) return "bg-green-600";
    if (val >= 3) return "bg-green-400";
    if (val >= 1) return "bg-green-200";
    return "bg-gray-200";
  };

  return (
    <div className="max-w-full overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Submission Calendar</h3>

      {/* Month labels */}
      <div className="flex ml-6">
        <div className="w-4" /> {/* Spacer for weekday labels */}
        {weeks.map((_, i) => (
          <div key={`month-${i}`} className="w-4 text-xs text-gray-500 text-center">
            {monthLabels[i]?.label || ""}
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="flex">
        {/* Weekday labels */}
        

        {/* Week columns */}
        <div className="flex gap-[2px]">
          {weeks.map((week, i) => {
            const currentWeek = week;
            const nextWeek = weeks[i + 1];

            const firstDayCurrent = currentWeek[0];
            const firstDayNext = nextWeek?.[0];

            const isMonthEnding =
              firstDayNext && !isSameMonth(firstDayCurrent, firstDayNext);

            return (
              <div key={`week-${i}`} className="flex flex-row items-start">
                <div className="flex flex-col gap-[2px]">
                  {currentWeek.map((date) => {
                    const formatted = format(date, "yyyy-MM-dd");
                    const count = data[formatted] || 0;

                    return (
                      <TooltipProvider key={formatted}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-4 h-4 rounded-sm ${colorScale(count)} transition-all`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center">
                            <p>
                              {count} problem{count !== 1 ? "s" : ""} on{" "}
                              {format(date, "MMM d, yyyy")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>

                {/* Spacer after month ends */}
                {isMonthEnding && <div className="w-4" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
