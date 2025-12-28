import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

export function PersonalityRadar({ data, compact = false }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Get container dimensions for responsive sizing
    const container = containerRef.current;
    if (!container) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const containerRect = container.getBoundingClientRect();
    const padding = compact ? 40 : 80;
    const width = containerRect.width - (padding * 2);
    const height = compact ? 350 : Math.min(550, width * 0.9);
    const radius = Math.min(width, height) / 2 - 100; // Much more margin for labels

    // Create scales
    const angleScale = d3.scaleLinear()
      .domain([0, data.length])
      .range([0, 2 * Math.PI]);

    // Find the maximum value to scale appropriately
    const maxValue = Math.max(...data.map(d => d.score), 1);
    
    const radiusScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, radius]);

    // Create line generator
    const lineGenerator = d3.lineRadial()
      .angle((d, i) => angleScale(i))
      .radius(d => radiusScale(d.score))
      .curve(d3.curveLinearClosed);

    // Create area generator
    const areaGenerator = d3.areaRadial()
      .angle((d, i) => angleScale(i))
      .innerRadius(0)
      .outerRadius(d => radiusScale(d.score))
      .curve(d3.curveLinearClosed);

    // Set SVG dimensions and viewBox for responsiveness
    svg
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw the circular grid
    const levels = 5;
    for (let level = 0; level < levels; level++) {
      const levelFactor = radius * ((level + 1) / levels);
      
      g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", levelFactor)
        .style("stroke", "#E5E5E7")
        .style("stroke-width", "1px")
        .style("fill", "none");
      
      // Add scale labels on the first axis
      if (!compact) {
        const scaleValue = (level + 1) / levels * maxValue;
        // Show integers without decimals, otherwise show one decimal
        const displayValue = scaleValue % 1 === 0 ? scaleValue.toString() : scaleValue.toFixed(1);
        g.append("text")
          .attr("x", 5)
          .attr("y", -levelFactor + 3)
          .style("font-size", "10px")
          .style("fill", "#8E8E93")
          .style("font-weight", "400")
          .text(displayValue);
      }
    }

    // Draw the axes
    data.forEach((_, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(angle))
        .attr("y2", radius * Math.sin(angle))
        .style("stroke", "#E5E5E7")
        .style("stroke-width", "1px");
    });

    // Draw the radar area
    const radarPath = g.append("path")
      .datum(data)
      .attr("d", areaGenerator)
      .attr("fill", "url(#radarGradient)")
      .attr("opacity", 0);

    // Draw the radar line
    const radarLine = g.append("path")
      .datum(data)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", "#007AFF")
      .attr("stroke-width", 2)
      .attr("opacity", 0);

    // Animate radar area and line
    radarPath.transition()
      .duration(1000)
      .attr("opacity", 1);

    radarLine.transition()
      .duration(1000)
      .attr("opacity", 1);

    // Add gradient for radar area
    const gradient = svg.append("defs")
      .append("radialGradient")
      .attr("id", "radarGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#007AFF")
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#007AFF")
      .attr("stop-opacity", 0.1);

    // Add dots at data points
    const dots = g.selectAll(".radar-dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "radar-dot")
      .attr("cx", (d, i) => {
        const angle = angleScale(i) - Math.PI / 2;
        return Math.cos(angle) * radiusScale(d.score);
      })
      .attr("cy", (d, i) => {
        const angle = angleScale(i) - Math.PI / 2;
        return Math.sin(angle) * radiusScale(d.score);
      })
      .attr("r", 0)
      .style("fill", "white")
      .style("stroke", "#007AFF")
      .style("stroke-width", "2px");

    // Animate dots
    dots.transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("r", compact ? 4 : 5);

    // Add labels
    const labels = g.selectAll(".radar-label")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "radar-label")
      .attr("transform", (d, i) => {
        const angle = angleScale(i) - Math.PI / 2;
        const labelRadius = radius + 40; // Further increased label distance
        const x = Math.cos(angle) * labelRadius;
        const y = Math.sin(angle) * labelRadius;
        return `translate(${x}, ${y})`;
      });

    labels.append("text")
      .attr("text-anchor", (d, i) => {
        const angle = angleScale(i) - Math.PI / 2;
        const x = Math.cos(angle);
        // More precise text anchoring based on x position
        if (Math.abs(x) < 0.1) return "middle";
        return x > 0 ? "start" : "end";
      })
      .attr("dy", (d, i) => {
        const angle = angleScale(i) - Math.PI / 2;
        const y = Math.sin(angle);
        // Better vertical alignment based on y position
        if (y < -0.8) return "1em";
        if (y > 0.8) return "-0.3em";
        return "0.35em";
      })
      .style("fill", "#1D1D1F")
      .style("font-size", compact ? "12px" : "14px")
      .style("font-weight", "500")
      .text(d => d.trait)
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("opacity", 1);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "radar-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #E5E5E7")
      .style("border-radius", "8px")
      .style("padding", "12px")
      .style("font-size", "13px")
      .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.08)")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    // Add hover effects
    dots.on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", compact ? 6 : 7)
        .style("fill", "#007AFF");
      
      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      
      // Handle scores that might be normalized or raw values
      const displayScore = d.score > 1 ? d.score.toFixed(1) : (d.score * 10).toFixed(1);
      const maxScore = maxValue > 1 ? (maxValue * 10).toFixed(0) : "10";
      
      tooltip.html(`
        <div style="font-size: 14px; font-weight: 600; color: #1D1D1F; margin-bottom: 4px;">
          ${d.trait}
        </div>
        <div style="font-size: 13px; color: #8E8E93;">
          Score: ${displayScore}/${maxScore}
        </div>
      `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", compact ? 4 : 5)
        .style("fill", "white");
      
      tooltip.transition()
        .duration(200)
        .style("opacity", 0);
    });

    // Handle window resize
    const handleResize = () => {
      // Trigger re-render on resize
      svg.selectAll("*").remove();
      // The effect will re-run due to dependency change
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      d3.selectAll(".radar-tooltip").remove();
      window.removeEventListener('resize', handleResize);
    };

  }, [data, compact]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative bg-white rounded-xl ${compact ? 'p-6' : 'p-8'} border border-gray-200 shadow-sm`}
      style={{ minHeight: compact ? '400px' : '550px' }}
    >
      <svg ref={svgRef} className="w-full" style={{ display: 'block' }} />
    </motion.div>
  );
}
