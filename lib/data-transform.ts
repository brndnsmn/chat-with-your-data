export interface ChartDataPoint {
    name: string;
    value: number;
  }
  
  export interface ScatterDataPoint {
    x: number;
    y: number;
    service: string;
  }
  
  export function transformDataForChart(
    rawData: any[],
    labelColumn: string,
    valueColumn: string
  ): ChartDataPoint[] {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }
  
    return rawData.map((row, index) => ({
      name: row[labelColumn]?.toString() || `Item ${index + 1}`,
      value: Number(row[valueColumn]) || 0
    }));
  }
  
  export function transformDataForScatter(
    rawData: any[],
    xColumn: string,
    yColumn: string,
    serviceColumn?: string
  ): ScatterDataPoint[] {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }
  
    return rawData.map((row, index) => ({
      x: Number(row[xColumn]) || 0,
      y: Number(row[yColumn]) || 0,
      service: serviceColumn ? (row[serviceColumn]?.toString() || `Service ${index + 1}`) : `Service ${index + 1}`
    }));
  }
  
  export function detectColumns(rawData: any[]): {
    textColumns: string[];
    numericColumns: string[];
    allColumns: string[];
  } {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return { textColumns: [], numericColumns: [], allColumns: [] };
    }
  
    const allColumns = Object.keys(rawData[0] || {});
    const textColumns: string[] = [];
    const numericColumns: string[] = [];
  
    allColumns.forEach(column => {
      const sampleValue = rawData[0][column];
      if (typeof sampleValue === 'number' || !isNaN(Number(sampleValue))) {
        numericColumns.push(column);
      } else {
        textColumns.push(column);
      }
    });
  
    return { textColumns, numericColumns, allColumns };
  }