import assert from 'node:assert/strict';
import test from 'node:test';
import { toLiveTelemetry } from './openMeteo.ts';

const NOON = new Date('2026-11-19T12:00:00');

test('toLiveTelemetry converts Open-Meteo readings to CPCB telemetry with a 48-hour forecast', () => {
  const times = Array.from({ length: 50 }, (_, h) => `2026-11-19T${String(h % 24).padStart(2, '0')}:00`);
  const telemetry = toLiveTelemetry(
    {
      current: { time: '2026-11-19T12:00', pm2_5: 232.04, pm10: 378, nitrogen_dioxide: 78, ozone: 24 },
      hourly: { time: times, pm2_5: times.map(() => 120), pm10: times.map(() => null) },
    },
    {
      current: { temperature_2m: 11.4, relative_humidity_2m: 79.4, wind_speed_10m: 4.2 },
      hourly: { boundary_layer_height: Array.from({ length: 24 }, (_, h) => 100 + h) },
    },
    NOON
  );

  assert.equal(telemetry.source, 'open-meteo-live');
  assert.equal(telemetry.pm25, 232);
  assert.equal(telemetry.aqi, 386, 'CPCB AQI is governed by PM2.5 = 232');
  assert.equal(telemetry.humidityPct, 79);
  assert.equal(telemetry.mixingHeightM, 112, 'uses the boundary-layer height for the current hour');
  assert.equal(telemetry.forecast48h.length, 48, 'forecast is capped at 48 hours');
  assert.equal(telemetry.forecast48h[0].pm10, 378, 'missing hourly PM10 falls back to the current reading');
  assert.equal(telemetry.forecast48h[30].dayLabel, 'Tomorrow');
});

test('toLiveTelemetry fills gaps when weather is unavailable', () => {
  const telemetry = toLiveTelemetry({ current: { pm2_5: 40, pm10: 60 } }, null, NOON);
  assert.equal(telemetry.forecast48h.length, 0);
  assert.ok(telemetry.mixingHeightM >= 180, 'estimated mixing height never drops below 180 m');
  assert.equal(telemetry.updatedAt, NOON.toISOString());
});
