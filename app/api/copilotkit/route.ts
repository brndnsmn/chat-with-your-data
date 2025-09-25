import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { tavily } from '@tavily/core';
import { NextRequest } from 'next/server';
import { transformDataForChart, transformDataForScatter, detectColumns } from '../../../lib/data-transform';

const serviceAdapter = new OpenAIAdapter({});

const runtime = new CopilotRuntime({
  actions: ({properties, url}) => {
    return [
      {
        name: "searchInternet",
        description: "Searches the internet for information.",
        parameters: [
          {
            name: "query",
            type: "string",
            description: "The query to search the internet for.",
            required: true,
          },
        ],
        handler: async ({query}: {query: string}) => {
          const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
          return await tvly.search(query, {max_results: 5});
        },
      },
      {
        name: "createChart",
        description: "Creates a chart visualization based on data analysis.",
        parameters: [
          {
            name: "chartType",
            type: "string",
            description: "The type of chart to create (bar, line, pie, area, scatter)",
            required: true,
          },
          {
            name: "title",
            type: "string",
            description: "The title of the chart",
            required: true,
          },
          {
            name: "data",
            type: "object",
            description: "The data to visualize in the chart",
            required: true,
          },
          {
            name: "description",
            type: "string",
            description: "Description of what the chart shows",
            required: false,
          },
        ],
        handler: async ({chartType, title, data, description}: {
          chartType: string;
          title: string;
          data: any;
          description?: string;
        }) => {
          console.log('createChart called with:', { chartType, title, data, description });
          console.log('Properties available:', Object.keys(properties || {}));
          console.log('Properties.sheets:', (properties as any)?.sheets);
          console.log('Properties.value:', (properties as any)?.value);
          
          let processedData = data;

          // data yoksa sheets'ten türet
          const tryBuildFromSheets = (sheetsObj: Record<string, any[]> | null | undefined) => {
            console.log('tryBuildFromSheets called with:', sheetsObj);
            if (!sheetsObj) {
              console.log('No sheets object found');
              return;
            }

            const firstSheetName = Object.keys(sheetsObj)[0];
            console.log('First sheet name:', firstSheetName);
            const rows = firstSheetName ? sheetsObj[firstSheetName] : [];
            if (Array.isArray(rows) && rows.length > 0) {
              const { textColumns, numericColumns } = detectColumns(rows);
              console.log('Detected columns:', { textColumns, numericColumns });

              
              if (chartType.toLowerCase() === 'scatter') {
                if (numericColumns.length >= 2) {
                  processedData = transformDataForScatter(
                    rows,
                    numericColumns[0],
                    numericColumns[1],
                    textColumns[0]
                  );
                }
              } else {
                if (textColumns.length > 0 && numericColumns.length > 0) {
                  processedData = transformDataForChart(
                    rows,
                    textColumns[0],
                    numericColumns[0]
                  );
                }
              }
              console.log('Built data from sheets:', { firstSheetName, processedDataSample: processedData?.slice?.(0,3) });
            }
          };

          if (!processedData) {
            // Client'tan gönderilen readable context iki yerde olabilir:
            // properties.sheets Veya properties.value.sheets
            const maybeSheets = (properties as any)?.sheets ?? (properties as any)?.value?.sheets;
            tryBuildFromSheets(maybeSheets);
          }
          
          // Veri array ise ve doğru formatta değilse dönüştür
          if (Array.isArray(processedData) && processedData.length > 0) {
            const firstItem = processedData[0];
            if (['bar', 'line', 'area', 'pie'].includes(chartType.toLowerCase())) {
              if (!firstItem.hasOwnProperty('name') || !firstItem.hasOwnProperty('value')) {
                const { textColumns, numericColumns } = detectColumns(processedData);
                if (textColumns.length > 0 && numericColumns.length > 0) {
                  processedData = transformDataForChart(
                    processedData, 
                    textColumns[0], 
                    numericColumns[0]
                  );
                }
              }
            }
            if (chartType.toLowerCase() === 'scatter') {
              if (!firstItem.hasOwnProperty('x') || !firstItem.hasOwnProperty('y')) {
                const { numericColumns, textColumns } = detectColumns(processedData);
                if (numericColumns.length >= 2) {
                  processedData = transformDataForScatter(
                    processedData,
                    numericColumns[0],
                    numericColumns[1],
                    textColumns[0]
                  );
                }
              }
            }
          }
          
          return {
            chartType,
            title,
            data: processedData,
            description,
            timestamp: new Date().toISOString()
          };
        },
      },
      {
        name: "analyzeDataSummary",
        description: "Analyzes uploaded sheet data and summarizes columns.",
        parameters: [{ name: "sheets", type: "object", required: true }],
        handler: async ({ sheets }: { sheets: Record<string, any[]> }) => {
          if (!sheets) return { summary: "No data provided" };
  
          const summary: Record<string, any> = {};
          for (const [sheetName, rows] of Object.entries(sheets)) {
            summary[sheetName] = {
              totalRows: rows.length,
              columns: Object.keys(rows[0] || {}),
            };
          }
          return { summary };
        },
      },
      {
        name: "showFullPageChart",
        description: "Shows a full-page chart view for maximum visibility.",
        parameters: [
          {
            name: "chartType",
            type: "string",
            description: "The type of chart to display (gantt, scatter, bar, line, pie, area)",
            required: true,
          },
          {
            name: "title",
            type: "string",
            description: "The title of the chart",
            required: true,
          },
          {
            name: "dataType",
            type: "string",
            description: "Type of data to extract (operations, services, errors)",
            required: true,
          },
          {
            name: "serviceFilter",
            type: "string",
            description: "Optional service name to filter by",
            required: false,
          },
        ],
        handler: async ({chartType, title, dataType, serviceFilter}: {
          chartType: string;
          title: string;
          dataType: string;
          serviceFilter?: string;
        }) => {
          return {
            chartType,
            title,
            dataType,
            serviceFilter,
            timestamp: new Date().toISOString()
          };
        },
      }
      ,
      {
        name: "resizeChart",
        description: "Resizes a specific chart by its ID or title.",
        parameters: [
          { name: "chartIdentifier", type: "string", description: "Chart ID or title", required: true },
          { name: "width", type: "number", description: "New width in px", required: true },
          { name: "height", type: "number", description: "New height in px", required: true },
        ],
        handler: async ({ chartIdentifier, width, height }: { chartIdentifier: string; width: number; height: number; }) => {
          return {
            action: "resizeChart",
            chartIdentifier,
            width: Math.max(200, width),
            height: Math.max(150, height),
            timestamp: new Date().toISOString()
          };
        },
      },
      {
        name: "resizeAllCharts",
        description: "Resizes all charts to a specific size.",
        parameters: [
          { name: "width", type: "number", required: true },
          { name: "height", type: "number", required: true },
        ],
        handler: async ({ width, height }: { width: number; height: number; }) => ({
          action: "resizeAllCharts",
          width: Math.max(200, width),
          height: Math.max(150, height),
          timestamp: new Date().toISOString()
        }),
      },
      {
        name: "makeChartsSmaller",
        description: "Scales all charts down by a factor.",
        parameters: [
          { name: "scaleFactor", type: "number", description: "0.1 - 1.0", required: false },
        ],
        handler: async ({ scaleFactor }: { scaleFactor?: number }) => {
          const factor = Math.max(0.1, Math.min(1.0, scaleFactor || 0.7));
          return { action: "makeChartsSmaller", scaleFactor: factor, timestamp: new Date().toISOString() };
        },
      },
      {
        name: "makeChartsLarger",
        description: "Scales all charts up by a factor.",
        parameters: [
          { name: "scaleFactor", type: "number", description: "1.0 - 3.0", required: false },
        ],
        handler: async ({ scaleFactor }: { scaleFactor?: number }) => {
          const factor = Math.max(1.0, Math.min(3.0, scaleFactor || 1.3));
          return { action: "makeChartsLarger", scaleFactor: factor, timestamp: new Date().toISOString() };
        },
      },
      {
        name: "arrangeChartsInGrid",
        description: "Arranges all charts into a grid layout.",
        parameters: [
          { name: "columns", type: "number", required: false },
          { name: "chartWidth", type: "number", required: false },
          { name: "chartHeight", type: "number", required: false },
        ],
        handler: async ({ columns, chartWidth, chartHeight }: { columns?: number; chartWidth?: number; chartHeight?: number; }) => ({
          action: "arrangeChartsInGrid",
          columns: columns || 2,
          chartWidth: chartWidth || 600,
          chartHeight: chartHeight || 300,
          timestamp: new Date().toISOString()
        }),
      },
      {
        name: "arrangePair",
        description: "Places two charts side by side by ID or title.",
        parameters: [
          { name: "first", type: "string", required: true },
          { name: "second", type: "string", required: true },
          { name: "chartWidth", type: "number", required: false },
          { name: "chartHeight", type: "number", required: false },
        ],
        handler: async ({ first, second, chartWidth, chartHeight }: { first: string; second: string; chartWidth?: number; chartHeight?: number; }) => ({
          action: "arrangePair",
          first,
          second,
          chartWidth: chartWidth || 600,
          chartHeight: chartHeight || 300,
          timestamp: new Date().toISOString()
        }),
      }
    ] as any;
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
};