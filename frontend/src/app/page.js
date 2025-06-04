"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  fontFamily: "'Inter', sans-serif",
  flowchart: {
    nodeSpacing: 60,
    rankSpacing: 40,
    useMaxWidth: false,
    // disable link gradients for cleaner look:
    linkStyle: "stroke:#34d399;stroke-width:1.5px;",
  },
  securityLevel: "loose", // if you trust input (optional)
});

function extractAndSanitizeMermaid(code) {
  const match = code.match(/```mermaid\s+([\s\S]*?)```/);
  if (!match) return null;

  let diagram = match[1];

  // Normalize line breaks between nodes (to separate node definitions)
  diagram = diagram.replace(/(?<=[\]\}])\s+(?=\w+[\[\{])/g, "\n");

  // Remove unwanted chars including nested square brackets from node labels inside [ ... ]
  diagram = diagram.replace(/([A-Z0-9]+)\[([^\]]+)\]/g, (_, id, label) => {
    // Remove unwanted chars: ', ", (, ), {, }, [, ]
    const sanitizedLabel = label.replace(/['"(){}\[\]]/g, "");
    return `${id}[${sanitizedLabel}]`;
  });

  // Sanitize reserved keywords as node IDs (avoid Mermaid reserved keywords causing parse errors)
  const reserved = ["end", "click", "class", "subgraph"];
  reserved.forEach((word) => {
    const wordRegex = new RegExp(`(?<=\\W|^)${word}(?=\\s*([\\[\\{\\(]))`, "gi");
    diagram = diagram.replace(wordRegex, `${word}Node`);
  });

  return diagram.trim();
}


// Simple syntax validator: checks balanced brackets and basic flow syntax hints
function isValidMermaid(diagram) {
  // Basic bracket balance check
  const stack = [];
  for (const ch of diagram) {
    if ("[{(".includes(ch)) stack.push(ch);
    else if ("]})".includes(ch)) {
      const last = stack.pop();
      if (
        (ch === "]" && last !== "[") ||
        (ch === "}" && last !== "{") ||
        (ch === ")" && last !== "(")
      )
        return false;
    }
  }
  if (stack.length !== 0) return false;

  // Could add more checks, but this covers many common syntax errors
  return true;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [diagramCode, setDiagramCode] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setDiagramCode("");

    try {
      const res = await fetch("https://codesage-production.up.railway.app/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: inputValue,
          topK: 5,
        }),
      });

      const data = await res.json();
      const raw = data.answer || "";
      console.log(raw)
      const sanitized = extractAndSanitizeMermaid(raw);

      if (sanitized && isValidMermaid(sanitized)) {
        setDiagramCode(sanitized);
      } else {
        setDiagramCode("Error: No valid Mermaid diagram found or syntax invalid.");
      }
    } catch (err) {
      console.error("Error fetching from backend:", err);
      setDiagramCode("Error: Failed to fetch data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!diagramCode || !containerRef.current) return;

  if (diagramCode.startsWith("Error:")) {
    containerRef.current.innerHTML = `<pre class="text-red-400">${diagramCode}</pre>`;
    return;
  }

  mermaid
    .render("generatedDiagram", diagramCode)
    .then(({ svg }) => {
      containerRef.current.innerHTML = svg;

      const svgEl = containerRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.style.maxWidth = "100%";
        svgEl.style.height = "auto";
        svgEl.style.borderRadius = "0.5rem";
        svgEl.style.backgroundColor = "#121212";

        // Add tooltips to all nodes and edges
        svgEl.querySelectorAll("g.node, g.edge").forEach((el) => {
          const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
          title.textContent = "This is a tool tip";
          el.appendChild(title);
        });
      }
    })
    .catch((err) => {
      console.error("Mermaid rendering error:", err);
      containerRef.current.innerHTML = `<pre class="text-red-400">Mermaid rendering error:\n${err.message}</pre>`;
    });
}, [diagramCode]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-[#121212] text-white">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center">
          <input
            className="flex-grow px-4 py-2 border border-gray-700 rounded-sm mr-4 bg-[#1e1e1e] text-white"
            type="text"
            placeholder="Ask something about the code..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button
            className="bg-[#232323] text-green-400 px-4 py-2 rounded-sm border border-green-700 hover:bg-green-800 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Loading..." : "Show Diagram"}
          </button>
        </div>

        <div className="bg-[#1a1a1a] p-4 rounded overflow-auto">
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
}
