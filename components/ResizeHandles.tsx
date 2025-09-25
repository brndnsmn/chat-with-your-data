// components/ResizeHandles.tsx
"use client";

import { useState, useRef } from "react";

interface ResizeHandlesProps {
  chartId: string;
  onResize: (id: string, size: { width: number; height: number }) => void;
}

export function ResizeHandles({ chartId, onResize }: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const startSize = useRef({ width: 0, height: 0 });
  const startMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation(); // Drag'i engelle
    setIsResizing(true);
    setResizeDirection(direction);
    startSize.current = { width: 1200, height: 400 }; // Default size
    startMouse.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMouse.current.x;
      const deltaY = e.clientY - startMouse.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      switch (direction) {
        case "se": // South East
          newWidth = Math.max(400, startSize.current.width + deltaX);
          newHeight = Math.max(200, startSize.current.height + deltaY);
          break;
        case "sw": // South West
          newWidth = Math.max(400, startSize.current.width - deltaX);
          newHeight = Math.max(200, startSize.current.height + deltaY);
          break;
        case "ne": // North East
          newWidth = Math.max(400, startSize.current.width + deltaX);
          newHeight = Math.max(200, startSize.current.height - deltaY);
          break;
        case "nw": // North West
          newWidth = Math.max(400, startSize.current.width - deltaX);
          newHeight = Math.max(200, startSize.current.height - deltaY);
          break;
      }

      onResize(chartId, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection("");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      {/* Resize handles - daha görünür yapalım */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize hover:bg-blue-600 rounded-tl-lg"
        onMouseDown={(e) => handleMouseDown(e, "se")}
      />
      <div
        className="resize-handle absolute bottom-0 left-0 w-4 h-4 bg-blue-500 cursor-sw-resize hover:bg-blue-600 rounded-tr-lg"
        onMouseDown={(e) => handleMouseDown(e, "sw")}
      />
      <div
        className="resize-handle absolute top-0 right-0 w-4 h-4 bg-blue-500 cursor-ne-resize hover:bg-blue-600 rounded-bl-lg"
        onMouseDown={(e) => handleMouseDown(e, "ne")}
      />
      <div
        className="resize-handle absolute top-0 left-0 w-4 h-4 bg-blue-500 cursor-nw-resize hover:bg-blue-600 rounded-br-lg"
        onMouseDown={(e) => handleMouseDown(e, "nw")}
      />
    </>
  );
}