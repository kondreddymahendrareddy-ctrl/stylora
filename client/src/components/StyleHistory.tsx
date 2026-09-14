import React, { useState, useEffect } from 'react';
import { fetchStyleAnalytics } from '../services/api';
import { 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Palette, 
  Shirt, 
  Sliders, 
  History as HistoryIcon, 
  Clock, 
  Sparkles 
} from 'lucide-react';

interface PieSlice {
  label: string;
  value: number;
  color: string;
  hex?: string;
}

const RenderPieChart: React.FC<{
  title: string;
  slices: PieSlice[];
  total: number;
  icon: React.ReactNode;
}> = ({ title, slices, total, icon }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!slices || slices.length === 0 || total === 0) {
    return (
      <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#ECE5DB] text-center">
        <p className="text-xs text-neutral-400">No data available for {title.toLowerCase()}</p>
      </div>
    );
  }

  // Calculate SVG arc parameters
  const R = 34;
  const C = 2 * Math.PI * R; // ~213.63
  let accumulatedPct = 0;

  const chartSlices = slices.map((slice, idx) => {
    const pct = slice.value / total;
    const strokeLength = pct * C;
    const strokeDashoffset = -accumulatedPct * C;
    accumulatedPct += pct;
    const percentageText = Math.round(pct * 100);

    return {
      ...slice,
      idx,
      pct,
      percentageText,
      strokeLength,
      strokeDashoffset
    };
  });

  const activeSlice = hoveredIdx !== null ? chartSlices[hoveredIdx] : null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs space-y-4 flex flex-col justify-between">
      {/* Chart Title */}
      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center space-x-2 border-b border-neutral-100 pb-3">
        {icon}
        <span>{title}</span>
      </h4>

      {/* Main Container: SVG Pie Chart Left + Legend Right */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
        {/* SVG Pie / Donut Canvas (5 Cols) */}
        <div className="sm:col-span-5 relative flex items-center justify-center py-2">
          <svg
            viewBox="0 0 100 100"
            className="w-36 h-36 transform -rotate-90 drop-shadow-xs"
          >
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="transparent"
              stroke="#F3F0EA"
              strokeWidth="18"
            />

            {/* SVG Pie Slices */}
            {chartSlices.map(s => (
              <circle
                key={s.label + s.idx}
                cx="50"
                cy="50"
                r={R}
                fill="transparent"
                stroke={s.hex || s.color}
                strokeWidth={hoveredIdx === s.idx ? '22' : '18'}
                strokeDasharray={`${s.strokeLength} ${C - s.strokeLength}`}
                strokeDashoffset={s.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer origin-center"
                onMouseEnter={() => setHoveredIdx(s.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Center Info Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {activeSlice ? (
              <>
                <span className="text-base font-serif font-bold text-neutral-900 leading-none">
                  {activeSlice.percentageText}%
                </span>
                <span className="text-[10px] text-neutral-500 font-medium truncate max-w-[70px] mt-0.5">
                  {activeSlice.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-serif font-bold text-neutral-900 leading-none">
                  {total}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider mt-0.5">
                  Total
                </span>
              </>
            )}
          </div>
        </div>

        {/* Clear Color Legend List (7 Cols) */}
        <div className="sm:col-span-7 space-y-2">
          {chartSlices.map(s => (
            <div
              key={s.label}
              onMouseEnter={() => setHoveredIdx(s.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                hoveredIdx === s.idx
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-[#FAF9F6] border-[#ECE5DB] text-neutral-800 hover:border-neutral-400'
              }`}
            >
              <div className="flex items-center space-x-2 truncate pr-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs flex-shrink-0"
                  style={{ backgroundColor: s.hex || s.color }}
                />
                <span className="text-xs font-semibold truncate capitalize">{s.label}</span>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  hoveredIdx === s.idx ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {s.percentageText}%
                </span>
                <span className={`text-[11px] font-medium ${hoveredIdx === s.idx ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  ({s.value})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StyleHistory: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '3m' | 'all'>('30d');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<{
    totalOutfits: number;
    colorCounts: { name: string; hex: string; count: number }[];
    styleCounts: { style: string; count: number }[];
    categoryCounts: { category: string; count: number }[];
    fitCounts: { fit: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchStyleAnalytics(timeFilter);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load style history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeFilter]);

  const timeFilters: { id: '7d' | '30d' | '3m' | 'all'; label: string }[] = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '3m', label: 'Last 3 Months' },
    { id: 'all', label: 'All Time' }
  ];

  const formatStyleLabel = (style: string) => {
    const formatted = style.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getStyleColor = (idx: number) => {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
    return palette[idx % palette.length];
  };

  const getCategoryColor = (idx: number) => {
    const palette = ['#059669', '#2563EB', '#D97706', '#7C3AED', '#DB2777'];
    return palette[idx % palette.length];
  };

  const getFitColor = (idx: number) => {
    const palette = ['#475569', '#0284C7', '#059669', '#D97706', '#9333EA'];
    return palette[idx % palette.length];
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ECE5DB] shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECE5DB] pb-5">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-neutral-900 flex items-center space-x-2.5">
            <HistoryIcon className="w-5 h-5 text-neutral-800" />
            <span>My Style History & Analytics</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Real outfit analytics, color preferences, and style choices over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Mode Switcher (Pie Chart vs Bar Chart) */}
          <div className="flex items-center space-x-1 bg-[#FAF9F6] p-1 rounded-full border border-[#ECE5DB]">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                chartType === 'pie'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Pie Chart</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                chartType === 'bar'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar Chart</span>
            </button>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center space-x-1 bg-[#FAF9F6] p-1 rounded-full border border-[#ECE5DB]">
            {timeFilters.map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  timeFilter === f.id
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">
          Loading style history analytics...
        </div>
      ) : !analytics || analytics.totalOutfits === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-[#FAF9F6] border border-dashed border-[#ECE5DB]">
          <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h4 className="font-serif text-lg font-medium text-neutral-800">No outfit history yet</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Your style history will appear here after you start creating and wearing outfits.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Badge */}
          <div className="flex items-center justify-between text-xs text-neutral-600 bg-[#FAF9F6] px-4 py-2.5 rounded-xl border border-[#ECE5DB]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                Calculated from <strong>{analytics.totalOutfits} outfits</strong> created in your history.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-white px-2.5 py-1 rounded-full border border-[#ECE5DB]">
              {chartType === 'pie' ? 'Pie Chart Mode' : 'Bar Chart Mode'}
            </span>
          </div>

          {/* PIE CHART VIEW */}
          {chartType === 'pie' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart 1: Colors */}
              <RenderPieChart
                title="Most Frequently Selected Colors"
                icon={<Palette className="w-4 h-4 text-neutral-700" />}
                total={analytics.colorCounts.reduce((sum, c) => sum + c.count, 0)}
                slices={analytics.colorCounts.slice(0, 6).map(c => ({
                  label: c.name,
                  value: c.count,
                  color: c.hex,
                  hex: c.hex
                }))}
              />

              {/* Pie Chart 2: Styles & Occasions */}
              <RenderPieChart
                title="Most Frequently Worn Styles"
                icon={<BarChart3 className="w-4 h-4 text-neutral-700" />}
                total={analytics.styleCounts.reduce((sum, s) => sum + s.count, 0)}
                slices={analytics.styleCounts.slice(0, 6).map((s, idx) => ({
                  label: formatStyleLabel(s.style),
                  value: s.count,
                  color: getStyleColor(idx)
                }))}
              />

              {/* Pie Chart 3: Category Usage */}
              <RenderPieChart
                title="Clothing Category Usage"
                icon={<Shirt className="w-4 h-4 text-neutral-700" />}
                total={analytics.categoryCounts.reduce((sum, c) => sum + c.count, 0)}
                slices={analytics.categoryCounts.map((cat, idx) => ({
                  label: cat.category,
                  value: cat.count,
                  color: getCategoryColor(idx)
                }))}
              />

              {/* Pie Chart 4: Fit Preferences */}
              <RenderPieChart
                title="Fit Preference Breakdown"
                icon={<Sliders className="w-4 h-4 text-neutral-700" />}
                total={analytics.fitCounts.reduce((sum, f) => sum + f.count, 0)}
                slices={analytics.fitCounts.map((f, idx) => ({
                  label: `${f.fit} fit`,
                  value: f.count,
                  color: getFitColor(idx)
                }))}
              />
            </div>
          )}

          {/* BAR CHART VIEW */}
          {chartType === 'bar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart 1: Colors */}
              <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center space-x-2 border-b border-neutral-100 pb-3">
                  <Palette className="w-4 h-4 text-neutral-700" />
                  <span>Most Frequently Selected Colors</span>
                </h4>
                <div className="space-y-2.5">
                  {analytics.colorCounts.slice(0, 5).map(c => {
                    const max = Math.max(...analytics.colorCounts.map(i => i.count), 1);
                    const pct = Math.round((c.count / max) * 100);
                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs inline-block"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-neutral-800 capitalize">{c.name}</span>
                          </div>
                          <span className="text-neutral-500 text-[11px] font-semibold">{c.count} outfits</span>
                        </div>
                        <div className="w-full bg-[#F3F0EA] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar Chart 2: Styles */}
              <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center space-x-2 border-b border-neutral-100 pb-3">
                  <BarChart3 className="w-4 h-4 text-neutral-700" />
                  <span>Most Frequently Worn Styles</span>
                </h4>
                <div className="space-y-2.5">
                  {analytics.styleCounts.slice(0, 5).map(s => {
                    const max = Math.max(...analytics.styleCounts.map(i => i.count), 1);
                    const pct = Math.round((s.count / max) * 100);
                    return (
                      <div key={s.style} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-neutral-800">{formatStyleLabel(s.style)}</span>
                          <span className="text-neutral-500 text-[11px] font-semibold">{s.count} times</span>
                        </div>
                        <div className="w-full bg-[#F3F0EA] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar Chart 3: Categories */}
              <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center space-x-2 border-b border-neutral-100 pb-3">
                  <Shirt className="w-4 h-4 text-neutral-700" />
                  <span>Clothing Category Usage</span>
                </h4>
                <div className="space-y-2.5">
                  {analytics.categoryCounts.map(cat => {
                    const max = Math.max(...analytics.categoryCounts.map(i => i.count), 1);
                    const pct = Math.round((cat.count / max) * 100);
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-neutral-800 capitalize">{cat.category}</span>
                          <span className="text-neutral-500 text-[11px] font-semibold">{cat.count} items</span>
                        </div>
                        <div className="w-full bg-[#F3F0EA] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar Chart 4: Fits */}
              <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center space-x-2 border-b border-neutral-100 pb-3">
                  <Sliders className="w-4 h-4 text-neutral-700" />
                  <span>Fit Preference Breakdown</span>
                </h4>
                <div className="space-y-2.5">
                  {analytics.fitCounts.map(f => {
                    const max = Math.max(...analytics.fitCounts.map(i => i.count), 1);
                    const pct = Math.round((f.count / max) * 100);
                    return (
                      <div key={f.fit} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-neutral-800 capitalize">{f.fit} fit</span>
                          <span className="text-neutral-500 text-[11px] font-semibold">{f.count} worn</span>
                        </div>
                        <div className="w-full bg-[#F3F0EA] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-700 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
