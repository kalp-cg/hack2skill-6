import { Thermometer, Droplets, Wind, Layers } from 'lucide-react';
import { AirSnapshot, AqiBand } from '../../types/saans';

interface AqiRingGaugeProps {
  air: AirSnapshot;
  band: AqiBand;
}

export function AqiRingGauge({ air, band }: AqiRingGaugeProps) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0.05, air.aqi / 500));
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Animated SVG Ring Gauge */}
      <div className="relative flex h-48 w-48 shrink-0 items-center justify-center">
        <svg viewBox="0 0 184 184" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="92"
            cy="92"
            r={radius}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="12"
          />
          <circle
            cx="92"
            cy="92"
            r={radius}
            fill="none"
            stroke={band.colorHex}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">CPCB AQI</span>
          <span className="font-mono text-5xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {air.aqi}
          </span>
          <span className={`mt-0.5 text-sm font-semibold ${band.textClass}`}>{band.shortLabel}</span>
        </div>
      </div>

      {/* Pollutants & Weather Telemetry Grid */}
      <div className="w-full flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'PM2.5', value: air.pm25, unit: 'µg/m³' },
            { label: 'PM10', value: air.pm10, unit: 'µg/m³' },
            { label: 'NO₂', value: air.no2, unit: 'µg/m³' },
            { label: 'O₃', value: air.o3, unit: 'µg/m³' },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{p.label}</div>
              <div className="mt-1 font-mono text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                {p.value}{' '}
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {p.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200 dark:border-slate-800 pt-3 sm:grid-cols-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Thermometer className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-mono tabular-nums">{air.tempC}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Droplets className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-mono tabular-nums">{air.humidityPct}% RH</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Wind className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-mono tabular-nums">{air.windKmh} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Layers className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-mono tabular-nums">{air.mixingHeightM} m mix</span>
          </div>
        </div>
      </div>
    </div>
  );
}
