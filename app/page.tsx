// app/page.tsx - Güncellenmiş versiyon
"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { FileUpload, ParsedSheets } from "@/components/FileUpload";
import { DashboardGrid } from "@/components/DashboardGrid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { prompt } from "@/lib/prompt";
import { CustomAssistantMessage } from "../components/AssistantMessage";
import { SearchResults } from "@/components/generative-ui/SearchResults";
import { ChartRenderer } from "@/components/generative-ui/ChartRenderer";

interface ChartItem {
  id: string;
  chartType: string;
  title: string;
  data: any[];
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export default function Page() {
  const [sheets, setSheets] = useState<ParsedSheets | null>(null);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const CHROME_Y = 140;

  // AI'ya veri sunumu
  useCopilotReadable({
    description: "User uploaded data and charts",
    value: { sheets, charts, error },
  });

  useCopilotAction({
    name: "searchInternet",
    available: "disabled",
    description: "Searches the internet for information.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The query to search the internet for.",
        required: true,
      }
    ],
    render: ({args, status}) => {
      return <SearchResults query={args.query || 'No query provided'} status={status} />;
    }
  });


  // createChart action güncellemesi
  useCopilotAction({
    name: "createChart",
    available: sheets ? "enabled" : "disabled",
    description: "Creates a chart visualization based on data analysis.",
    parameters: [
      { name: "chartType", type: "string", required: true },
      { name: "title", type: "string", required: true },
      { name: "data", type: "object", required: true },
      { name: "description", type: "string", required: false },
    ],
    render: ({ args }) => (
      <ChartRenderer
        chartType={args?.chartType || 'bar'}
        title={args?.title || 'Chart'}
        data={args?.data || []}
        description={args?.description}
      />
    ),
    handler: async (args) => {
      setCharts((prev) => {
        const gap = 20;
        const maxBottom = prev.reduce((m, c) => Math.max(m, c.position.y + c.size.height + CHROME_Y), 0);
        const newChart: ChartItem = {
          id: `chart-${Date.now()}`,
          chartType: args.chartType,
          title: args.title,
          data: args.data as any[],
          description: args.description,
          position: { x: 0, y: maxBottom + gap },
          size: { width: 1200, height: 400 },
        };
        return [...prev, newChart];
      });
    },
  });

  // resizeChart
  useCopilotAction({
    name: "resizeChart",
    available: charts.length > 0 ? "enabled" : "disabled",
    description: "Resizes a specific chart by its ID or title.",
    parameters: [
      { name: "chartIdentifier", type: "string", required: true },
      { name: "width", type: "number", required: true },
      { name: "height", type: "number", required: true },
    ],
    handler: async ({ chartIdentifier, width, height }) => {
      setCharts(prev => prev.map(c =>
        (c.id === chartIdentifier || c.title === chartIdentifier)
          ? { ...c, size: { width, height } }
          : c
      ));
    },
  });

  // resizeAllCharts
  useCopilotAction({
    name: "resizeAllCharts",
    available: charts.length > 0 ? "enabled" : "disabled",
    description: "Resizes all charts to the same size.",
    parameters: [
      { name: "width", type: "number", required: true },
      { name: "height", type: "number", required: true },
    ],
    handler: async ({ width, height }) => {
      setCharts(prev => prev.map(c => ({ ...c, size: { width, height } })));
    },
  });

  // makeChartsSmaller
  useCopilotAction({
    name: "makeChartsSmaller",
    available: charts.length > 0 ? "enabled" : "disabled",
    description: "Scales all charts down by a factor.",
    parameters: [
      { name: "scaleFactor", type: "number", required: false },
    ],
    handler: async ({ scaleFactor = 0.7 }) => {
      setCharts(prev => prev.map(c => ({
        ...c,
        size: {
          width: Math.max(200, c.size.width * scaleFactor),
          height: Math.max(150, c.size.height * scaleFactor),
        }
      })));
    },
  });

  // makeChartsLarger
  useCopilotAction({
    name: "makeChartsLarger",
    available: charts.length > 0 ? "enabled" : "disabled",
    description: "Scales all charts up by a factor.",
    parameters: [
      { name: "scaleFactor", type: "number", required: false },
    ],
    handler: async ({ scaleFactor = 1.3 }) => {
      setCharts(prev => prev.map(c => ({
        ...c,
        size: {
          width: Math.min(2000, c.size.width * scaleFactor),
          height: Math.min(1000, c.size.height * scaleFactor),
        }
      })));
    },
  });

  // arrangeChartsInGrid
  useCopilotAction({
    name: "arrangeChartsInGrid",
    available: charts.length > 0 ? "enabled" : "disabled",
    description: "Arranges all charts into a grid.",
    parameters: [
      { name: "columns", type: "number", required: false },
      { name: "chartWidth", type: "number", required: false },
      { name: "chartHeight", type: "number", required: false },
    ],
    handler: async ({ columns = 2, chartWidth = 600, chartHeight = 300 }) => {
      const gap = 20;
      setCharts(prev => prev.map((c, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        return {
          ...c,
          position: { x: col * (chartWidth + gap), y: row * (chartHeight + CHROME_Y + gap) },
          size: { width: chartWidth, height: chartHeight },
        };
      }));
    },
  });

  // arrangePair (two charts side by side)
  useCopilotAction({
    name: "arrangePair",
    available: charts.length > 1 ? "enabled" : "disabled",
    description: "Places two charts side by side by ID or title.",
    parameters: [
      { name: "first", type: "string", required: true },
      { name: "second", type: "string", required: true },
      { name: "chartWidth", type: "number", required: false },
      { name: "chartHeight", type: "number", required: false },
    ],
    handler: async ({ first, second, chartWidth = 600, chartHeight = 300 }) => {
      const gap = 20;
      setCharts(prev => {
        const updated = [...prev];
        const match = (c: any, key: string) => c.id === key || c.title === key;
        const firstIdx = updated.findIndex(c => match(c, first));
        const secondIdx = updated.findIndex(c => match(c, second));
        if (firstIdx === -1 || secondIdx === -1) return prev;

        // Place pair on top row
        updated[firstIdx] = {
          ...updated[firstIdx],
          position: { x: 0, y: 0 },
          size: { width: chartWidth, height: chartHeight },
        };
        updated[secondIdx] = {
          ...updated[secondIdx],
          position: { x: chartWidth + gap, y: 0 },
          size: { width: chartWidth, height: chartHeight },
        };

        // Reflow the rest into grid starting from next row
        const rest = updated
          .map((c, i) => ({ c, i }))
          .filter(({ i }) => i !== firstIdx && i !== secondIdx)
          .map(({ c }) => c);

        const columns = 2;
        rest.forEach((c, idx) => {
          const row = Math.floor(idx / columns) + 1; // start from next row
          const col = idx % columns;
          c.position = { x: col * (chartWidth + gap), y: row * (chartHeight + CHROME_Y + gap) } as any;
          c.size = { width: chartWidth, height: chartHeight } as any;
        });

        return [...updated];
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Your Data</CardTitle>
            <CardDescription>Upload an Excel/CSV file to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onDataParsed={(data) => {
                setSheets(data);
                setCharts([]);
                setError(null);
              }}
            />
          </CardContent>
        
        </Card>

        {/* URL'den chart yükleme */}
        {typeof window !== "undefined" && charts.length === 0 && (() => {
          const urlParams = new URLSearchParams(window.location.search);
          const param = urlParams.get("chart");
          if (param) {
            try {
              const parsed = JSON.parse(atob(decodeURIComponent(param)));
              if (parsed?.chartType && parsed?.data) {
                setCharts([{
                  id: `chart-${Date.now()}`,
                  chartType: parsed.chartType,
                  title: parsed.title || "Shared Chart",
                  data: parsed.data,
                  description: parsed.description,
                  position: { x: 0, y: 0 },
                  size: { width: 1200, height: 400 },
                }]);
              }
            } catch {}
          }
          return null;
        })()}

        {/* Grid Layout Dashboard */}
        {charts.length > 0 && (
          <DashboardGrid 
            charts={charts} 
            onChartsChange={setCharts}
          />
        )}
        {/* Copilot Sidebar */}
        <CopilotSidebar
          instructions={prompt}
          AssistantMessage={CustomAssistantMessage}
          labels={{
            title: "Data Assistant",
            initial: "Hello! Upload your data and ask anything about it.",
            placeholder: "Ask about your data, trends, or create charts...",
          }}
        />
      </div>
    </div>
  );
}

