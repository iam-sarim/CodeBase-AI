"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidDiagram({ chart }) {
  const ref = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chart || !ref.current) return;

    const renderDiagram = async () => {
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        themeVariables: {
          primaryColor: "#3b82f6",
          primaryTextColor: "#fff",
          primaryBorderColor: "#1d4ed8",
          lineColor: "#6b7280",
          secondaryColor: "#1f2937",
          tertiaryColor: "#111827",
        },
      });

      try {
        // Clean the chart — remove trailing dots and fix common issues
        const cleanChart = chart
          .replace(/\.$/, "")
          .replace(/\. /g, " ")
          .replace(/-->(\w)/g, "--> $1")
          .trim();

        const id = "mermaid-" + Date.now();
        const { svg } = await mermaid.render(id, cleanChart);
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError(true);
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="bg-gray-950 rounded-xl p-4">
        <p className="text-gray-500 text-sm">Could not render diagram</p>
        <pre className="text-gray-600 text-xs mt-2 overflow-x-auto">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-gray-950 rounded-xl p-4 overflow-x-auto flex justify-center min-h-32"
    />
  );
}
