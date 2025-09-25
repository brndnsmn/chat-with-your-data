// components/DashboardGrid.tsx
"use client";

import { useState, useCallback } from "react";
import { ChartRenderer } from "./generative-ui/ChartRenderer";
// Manual resize/drag disabled in this branch

interface ChartItem {
  id: string;
  chartType: string;
  title: string;
  data: any[];
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface DashboardGridProps {
  charts: ChartItem[];
  onChartsChange: (charts: ChartItem[]) => void;
}

export function DashboardGrid({ charts, onChartsChange }: DashboardGridProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const moveChart = useCallback((id: string, newPosition: { x: number; y: number }) => {
    onChartsChange(
      charts.map(chart =>
        chart.id === id ? { ...chart, position: newPosition } : chart
      )
    );
  }, [charts, onChartsChange]);

  const resizeChart = useCallback((id: string, newSize: { width: number; height: number }) => {
    onChartsChange(
      charts.map(chart =>
        chart.id === id ? { ...chart, size: newSize } : chart
      )
    );
  }, [charts, onChartsChange]);

  const CHROME_Y = 140;

  const maxBottom = charts.reduce((m, c) => Math.max(m, c.position.y + c.size.height + CHROME_Y), 0);

  return (
    <div className="dashboard-container relative w-full min-h-screen bg-gray-50 p-4">
      <div
        className="charts-container relative w-full min-h-screen"
        style={{ height: Math.max(maxBottom + 20, 0) }}
      >
        {charts.map((chart) => (
          <ChartItemView
            key={chart.id}
            chart={chart}
          />
        ))}
      </div>
    </div>
  );
}

function ChartItemView({ chart }: { chart: ChartItem }) {
  return (
    <div
      className="chart-container absolute select-none"
      style={{
        width: chart.size.width,
        height: chart.size.height,
        left: chart.position.x,
        top: chart.position.y,
      }}
    >
      <ChartRenderer
        chartType={chart.chartType}
        title={chart.title}
        data={chart.data}
        description={chart.description}
      />
    </div>
  );
}