import React, { useEffect, useRef, useMemo, memo } from 'react';
import * as d3 from 'd3';
import { Project } from '../types';
import { Activity, PieChart, Zap } from 'lucide-react';

interface StatsVisualizerProps {
  projects: Project[];
}

const StatsVisualizer: React.FC<StatsVisualizerProps> = memo(({ projects }) => {
  const donutRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);

  const stats = useMemo(() => {
    let completed = 0;
    let analyzing = 0;
    let uploaded = 0;
    let total = 0;

    projects.forEach(p => {
      p.images.forEach(img => {
        total++;
        if (img.status === 'completed' || img.restoredPath) completed++;
        else if (img.status === 'analyzed' || img.status === 'restoring') analyzing++;
        else uploaded++;
      });
    });

    const timelineData = projects
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-12)
      .map(p => ({
        title: p.title,
        date: new Date(p.createdAt),
        count: p.images.length
      }));

    return {
      distribution: [
        { label: 'RECORED', value: completed, color: '#0ff0fc' },
        { label: 'ACTIVE', value: analyzing, color: '#7b2cff' },
        { label: 'INERT', value: uploaded, color: '#1e293b' }
      ],
      timeline: timelineData,
      total
    };
  }, [projects]);

  useEffect(() => {
    if (!donutRef.current || stats.total === 0) return;

    const width = 180;
    const height = 180;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<any>().value(d => d.value).sort(null);
    const arc = d3.arc<any>().innerRadius(radius * 0.75).outerRadius(radius * 0.95).cornerRadius(4);
    
    const dataReady = pie(stats.distribution.filter(d => d.value > 0));

    g.selectAll('path')
      .data(dataReady)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr("stroke", "#020617")
      .style("stroke-width", "3px")
      .style("opacity", 0)
      .transition()
      .duration(1200)
      .ease(d3.easeElasticOut)
      .style("opacity", 1)
      .attrTween("d", function(d) {
        const i = d3.interpolate(d.startAngle, d.endAngle);
        return function(t) {
          d.endAngle = i(t);
          return arc(d) as string;
        };
      });

    g.append("text")
      .text(`${stats.total}`)
      .attr("text-anchor", "middle")
      .attr("dy", "-0.1em")
      .style("font-size", "32px")
      .style("font-family", "Space Grotesk")
      .style("font-weight", "800")
      .style("fill", "white");

    g.append("text")
      .text("ASSETS")
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .style("font-size", "9px")
      .style("font-family", "JetBrains Mono")
      .style("font-weight", "bold")
      .style("fill", "#475569")
      .style("letter-spacing", "3px");

  }, [stats]);

  useEffect(() => {
    if (!barRef.current || stats.timeline.length === 0) return;

    const margin = { top: 10, right: 0, bottom: 5, left: 0 };
    const width = 300 - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    const svg = d3.select(barRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(stats.timeline.map((d, i) => i.toString()))
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stats.timeline, d => d.count) || 10])
      .range([height, 0]);

    g.selectAll("rect")
      .data(stats.timeline)
      .join("rect")
      .attr("x", (d, i) => x(i.toString())!)
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "#334155")
      .attr("rx", 2)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.count))
      .attr("height", d => height - y(d.count))
      .attr("fill", (d, i) => i === stats.timeline.length - 1 ? "#3b82f6" : "#1e293b");

  }, [stats]);

  if (projects.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mb-12 animate-in slide-in-from-top-4 duration-1000">
      <div className="bg-gray-900/30 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent"></div>
        
        <div className="flex items-center gap-10">
            <div className="relative w-[140px] h-[140px]">
                 <svg ref={donutRef} width="100%" height="100%" viewBox="0 0 180 180" className="overflow-visible"></svg>
                 <div className="absolute inset-[-15%] rounded-full border border-white/[0.03] animate-spin-slow pointer-events-none"></div>
            </div>
            
            <div className="flex flex-col gap-5">
                <h3 className="text-white font-display font-bold text-lg flex items-center gap-3">
                    <PieChart className="w-5 h-5 text-neon-cyan" /> Repository Analytics
                </h3>
                <div className="space-y-3">
                    {stats.distribution.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-[10px] font-mono">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }}></div>
                            <span className="text-gray-500 uppercase tracking-widest w-24">{item.label}</span>
                            <span className="text-white font-bold">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="hidden lg:block w-px h-24 bg-white/5"></div>

        <div className="flex-1 w-full lg:w-auto flex flex-col">
             <div className="flex justify-between w-full mb-6">
                <h3 className="text-white font-display font-bold text-lg flex items-center gap-3">
                    <Zap className="w-5 h-5 text-neon-pink" /> Ingestion Load
                </h3>
                <span className="text-[9px] font-mono text-gray-500 uppercase border border-white/5 px-2.5 py-1 rounded-full">Pipeline History</span>
             </div>
             
             <div className="w-full h-24 flex items-end">
                <svg ref={barRef} width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full opacity-60 hover:opacity-100 transition-opacity"></svg>
             </div>
             <p className="text-[9px] text-gray-600 font-mono mt-4 w-full tracking-widest uppercase flex items-center justify-between">
                 <span>T-Minus 12 Repositories</span>
                 <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time Telemetry</span>
             </p>
        </div>

      </div>
    </div>
  );
});

export default StatsVisualizer;