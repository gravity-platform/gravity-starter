import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, TrendingUp, Hash } from 'lucide-react';

export function ConversationTimeline({ memories }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!memories || memories.length === 0) return;

    // Get container dimensions
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Parse dates and sort memories
    const data = memories
      .map(m => {
        const timestamp = m.timestamp;
        const date = timestamp ? new Date(timestamp) : null;
        return {
          ...m,
          date: date,
          importance: m.content?.importance || 0.5,
          sentiment: m.content?.sentiment || 'neutral',
          summary: m.content?.summary || '',
          tags: m.content?.tags || []
        };
      })
      .filter(m => m.date && !isNaN(m.date.getTime())) // Filter out invalid dates
      .sort((a, b) => a.date - b.date);
    
    if (data.length === 0) return;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['positive', 'neutral', 'negative'])
      .range(['#34C759', '#8E8E93', '#FF3B30']);

    // Set SVG dimensions with viewBox for responsiveness
    svg
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add subtle background
    g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#FAFAFA")
      .attr("rx", 12);

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%b %d"))
      .ticks(Math.min(data.length, 7))
      .tickSize(10)
      .tickPadding(10);

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${Math.round(d * 100)}%`)
      .ticks(5);

    // X-axis with enhanced styling
    const xAxisGroup = g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "x-axis")
      .call(xAxis);

    // Style the axis line
    xAxisGroup.select(".domain")
      .attr("stroke", "#E5E5E7");

    // Style the tick lines
    xAxisGroup.selectAll(".tick line")
      .attr("stroke", "#E5E5E7");

    // Style and rotate the text labels
    xAxisGroup.selectAll(".tick text")
      .style("fill", "#86868B")
      .style("font-size", "12px")
      .style("font-weight", "400")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    // Y-axis with enhanced styling
    const yAxisGroup = g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    yAxisGroup.select(".domain")
      .attr("stroke", "#E5E5E7");

    yAxisGroup.selectAll(".tick line")
      .attr("stroke", "#E5E5E7");

    yAxisGroup.selectAll(".tick text")
      .style("fill", "#86868B")
      .style("font-size", "12px")
      .style("font-weight", "400");

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "#1D1D1F")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .text("Importance");

    // Add x-axis label
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "14px")
      .text("Timeline");

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.5)
      .selectAll("line")
      .style("stroke", "#E5E5E7");

    // Add importance line
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.importance))
      .curve(d3.curveMonotoneX);

    // Add the line with glow
    const path = g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#007AFF")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Animate the line
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Add dots
    const dots = g.selectAll(".dot")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "dot")
      .attr("transform", d => {
        const x = xScale(d.date);
        const y = yScale(d.importance);
        return (!isNaN(x) && !isNaN(y)) ? `translate(${x}, ${y})` : 'translate(0, 0)';
      });

    dots.append("circle")
      .attr("r", 0)
      .attr("fill", d => colorScale(d.sentiment))
      .attr("stroke", "none")
      .transition()
      .duration(500)
      .delay((d, i) => 2000 + i * 100)
      .attr("r", 8);

    // Create a single tooltip that we'll reuse
    const tooltip = g.append("g")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Add hover effects and tooltips
    dots.on("mouseover", function(event, d) {
      const dot = d3.select(this);
      
      dot.select("circle")
        .transition()
        .duration(200)
        .attr("r", 12);

      // Clear previous tooltip content
      tooltip.selectAll("*").remove();
      
      // Position and show tooltip
      const x = xScale(d.date);
      const y = yScale(d.importance) - 20;
      tooltip
        .attr("transform", (!isNaN(x) && !isNaN(y)) ? `translate(${x}, ${y})` : 'translate(0, 0)')
        .transition()
        .duration(200)
        .style("opacity", 1);

      // Calculate dynamic height based on content
      const summary = d.content?.summary || d.summary || 'No summary available';
      const tags = d.tags || d.content?.tags || [];
      const hasContent = summary && summary !== 'No summary available';
      const hasTags = tags.length > 0;
      const tooltipHeight = 80 + (hasTags ? 20 : 0);

      const rect = tooltip.append("rect")
        .attr("x", -175)
        .attr("y", -tooltipHeight + 20)
        .attr("width", 350)
        .attr("height", tooltipHeight)
        .attr("rx", 12)
        .attr("fill", "white")
        .attr("stroke", "#E5E5E7")
        .attr("stroke-width", 1)
        .style("filter", "drop-shadow(0 4px 16px rgba(0, 0, 0, 0.15))");

      // Add summary text with better wrapping
      const summaryGroup = tooltip.append("g");
      const words = summary.split(' ');
      let line = [];
      let lineNumber = 0;
      const lineHeight = 16;
      const maxWidth = 320;
      const yStart = -tooltipHeight + 45;
      
      const tspan = summaryGroup.append("text")
        .attr("x", 0)
        .attr("y", yStart)
        .attr("text-anchor", "middle")
        .attr("fill", "#1D1D1F")
        .attr("font-size", "14px")
        .attr("font-weight", "500");

      // Simple text wrapping for first 2 lines
      if (words.length <= 8) {
        tspan.text(summary);
      } else {
        const firstLine = words.slice(0, 6).join(' ');
        const secondLine = words.slice(6, 12).join(' ') + (words.length > 12 ? '...' : '');
        
        tspan.text(firstLine);
        tspan.append("tspan")
          .attr("x", 0)
          .attr("dy", lineHeight)
          .text(secondLine);
      }

      // Add timestamp
      tooltip.append("text")
        .attr("text-anchor", "middle")
        .attr("y", yStart + (words.length > 8 ? 35 : 20))
        .attr("fill", "#86868B")
        .attr("font-size", "12px")
        .text(d.date ? d3.timeFormat("%b %d, %Y • %I:%M %p")(d.date) : '');

      // Add tags if present
      if (hasTags) {
        const tagText = tags.slice(0, 3).join(" • ");
        tooltip.append("text")
          .attr("text-anchor", "middle")
          .attr("y", yStart + (words.length > 8 ? 55 : 40))
          .attr("fill", "#007AFF")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .text(tagText);
      }
    })
    .on("mouseout", function() {
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", 8);

      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0);
    });

    // Add legend - position it dynamically based on width
    const legendX = width > 600 ? width - 120 : width - 100;
    const legend = g.append("g")
      .attr("transform", `translate(${legendX}, 20)`);

    const sentiments = ['positive', 'neutral', 'negative'];
    sentiments.forEach((sentiment, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("circle")
        .attr("r", 6)
        .attr("fill", colorScale(sentiment));

      legendRow.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("fill", "#1D1D1F")
        .attr("font-size", "12px")
        .text(sentiment.charAt(0).toUpperCase() + sentiment.slice(1));
    });

    // Handle window resize
    const handleResize = () => {
      // Re-render on resize by clearing and letting effect re-run
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [memories]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gray-400" />
          Memory Timeline
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {memories.length} memories
          </span>
          <span className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Importance over time
          </span>
          {memories.length > 0 && (() => {
            const dates = memories
              .map(m => m.metadata?.timestamp || m.timestamp)
              .filter(Boolean)
              .map(t => new Date(t))
              .filter(d => !isNaN(d.getTime()))
              .sort((a, b) => a - b);
            
            if (dates.length > 0) {
              const startDate = d3.timeFormat("%b %d")(dates[0]);
              const endDate = d3.timeFormat("%b %d, %Y")(dates[dates.length - 1]);
              return (
                <span className="flex items-center text-blue-500">
                  <Hash className="w-4 h-4 mr-1" />
                  {startDate} - {endDate}
                </span>
              );
            }
            return null;
          })()}
        </div>
      </div>
      <svg ref={svgRef} className="w-full" style={{ display: 'block' }} />
    </motion.div>
  );
}
