import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { DailyTrend } from '../../services/adminMetrics';

interface AdminTrendsChartProps {
  data: DailyTrend[];
}

export default function AdminTrendsChart({ data }: AdminTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxUsers = Math.max(...data.map((d) => d.newUsers), 1);
    const maxProjects = Math.max(...data.map((d) => d.newProjects), 1);
    const maxSurveys = Math.max(...data.map((d) => d.surveysRun), 1);
    const maxValue = Math.max(maxUsers, maxProjects, maxSurveys);

    return {
      data,
      maxValue,
      maxUsers,
      maxProjects,
      maxSurveys,
    };
  }, [data]);

  if (!chartData || data.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          Not enough data to display trends yet.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  // Simple bar chart visualization
  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#27AAE1] rounded"></div>
          <span className="text-slate-700 dark:text-slate-300">New Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-slate-700 dark:text-slate-300">New Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-slate-700 dark:text-slate-300">Surveys Run</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative overflow-x-auto">
        <div className="flex items-end justify-between gap-1 min-w-[800px] h-64 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          {chartData.data.map((day, index) => {
            const userHeight = (day.newUsers / chartData.maxValue) * 100;
            const projectHeight = (day.newProjects / chartData.maxValue) * 100;
            const surveyHeight = (day.surveysRun / chartData.maxValue) * 100;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Bars */}
                <div className="flex items-end gap-0.5 w-full justify-center">
                  {/* Users bar */}
                  <div
                    className="w-2 bg-[#27AAE1] rounded-t transition-all hover:opacity-80"
                    style={{ height: `${Math.max(userHeight, 2)}%` }}
                    title={`${day.newUsers} new users`}
                  ></div>
                  {/* Projects bar */}
                  <div
                    className="w-2 bg-purple-500 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${Math.max(projectHeight, 2)}%` }}
                    title={`${day.newProjects} new projects`}
                  ></div>
                  {/* Surveys bar */}
                  <div
                    className="w-2 bg-green-500 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${Math.max(surveyHeight, 2)}%` }}
                    title={`${day.surveysRun} surveys`}
                  ></div>
                </div>

                {/* Date label (show every 5th date) */}
                {index % 5 === 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
                    {formatDate(day.date)}
                  </span>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                  <div className="font-semibold mb-1">{formatDate(day.date)}</div>
                  <div>Users: {day.newUsers}</div>
                  <div>Projects: {day.newProjects}</div>
                  <div>Surveys: {day.surveysRun}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#27AAE1]">{chartData.data.reduce((sum, d) => sum + d.newUsers, 0)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total New Users</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-500">{chartData.data.reduce((sum, d) => sum + d.newProjects, 0)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total New Projects</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-500">{chartData.data.reduce((sum, d) => sum + d.surveysRun, 0)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Surveys</p>
        </div>
      </div>
    </div>
  );
}
