import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
});

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      containerRef.current.innerHTML = '';
      try {
        mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        });
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="text-red-400 text-xs">Failed to render diagram. Check the syntax.</div><pre class="text-xs mt-2">${chart}</pre>`;
        }
      }
    }
  }, [chart]);

  return <div ref={containerRef} className="overflow-x-auto flex justify-center p-4 bg-black/40 rounded-lg" />;
};
