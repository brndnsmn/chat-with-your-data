"use client";
import { useState } from "react";
import { FileUpload, ParsedSheets } from "./FileUpload";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ChartRenderer } from "./generative-ui/ChartRenderer";
import { SearchResults } from "./generative-ui/SearchResults";

export function Dashboard() {
  const [sheets, setSheets] = useState<ParsedSheets | null>(null);

  useCopilotReadable({
    description: "Raw sheet data from the user's uploaded file.",
    value: sheets || "No file has been uploaded yet.",
  });

  useCopilotAction({
    name: "searchInternet",
    available: "enabled",
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



  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Upload Your Data</CardTitle>
            <CardDescription className="text-xs">Upload an Excel/CSV file to begin.</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <FileUpload
              onDataParsed={(data) => {
                setSheets(data);
              }}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}