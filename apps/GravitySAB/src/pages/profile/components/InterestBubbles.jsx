import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

export function InterestBubbles({ data, compact = false }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = compact ? 400 : 800;
    const height = compact ? 300 : 600;

    // Create subtle Apple-inspired color palette
    const colors = [
      '#007AFF', // blue
      '#34C759', // green
      '#FF9500', // orange
      '#AF52DE', // purple
      '#FF3B30', // red
      '#00C7BE', // teal
    ];
    
    const colorScale = d3.scaleOrdinal()
      .domain(data.map((_, i) => i))
      .range(colors);

    // Create size scale
    const sizeScale = d3.scaleLinear()
      .domain([0, 1])
      .range(compact ? [20, 60] : [30, 100]);

    // Create pack layout
    const pack = d3.pack()
      .size([width, height])
      .padding(5);

    // Transform data for hierarchy
    const hierarchyData = {
      name: "interests",
      children: data.map(d => ({
        name: d.name,
        value: d.weight
      }))
    };

    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    pack(root);

    // Create force simulation
    const simulation = d3.forceSimulation(root.children)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collide", d3.forceCollide(d => sizeScale(d.data.value) + 2))
      .force("charge", d3.forceManyBody().strength(-50));

    // Create groups for bubbles
    const bubbleGroups = svg
      .attr("width", width)
      .attr("height", height)
      .selectAll("g")
      .data(root.children)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Add subtle gradient definitions
    const defs = svg.append("defs");
    
    root.children.forEach((d, i) => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${i}`)
        .attr("cx", "50%")
        .attr("cy", "50%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(colorScale(i)).brighter(1.5))
        .attr("stop-opacity", 0.15);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(i))
        .attr("stop-opacity", 0.25);
    });

    // Add circles with subtle gradient
    bubbleGroups.append("circle")
      .attr("r", 0)
      .attr("fill", (d, i) => `url(#gradient-${i})`)
      .attr("stroke", (d, i) => colorScale(i))
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.3)
      .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))")
      .transition()
      .duration(1000)
      .ease(d3.easeElasticOut)
      .attr("r", d => sizeScale(d.data.value));

    // Add text with improved placement
    bubbleGroups.append("foreignObject")
      .attr("x", d => -sizeScale(d.data.value) * 0.8)
      .attr("y", d => -sizeScale(d.data.value) * 0.5)
      .attr("width", d => sizeScale(d.data.value) * 1.6)
      .attr("height", d => sizeScale(d.data.value))
      .style("pointer-events", "none")
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("padding", "10%")
      .style("box-sizing", "border-box")
      .append("xhtml:div")
      .style("color", (d, i) => colorScale(i))
      .style("font-weight", "500")
      .style("line-height", "1.3")
      .style("font-size", d => {
        const radius = sizeScale(d.data.value);
        const textLength = d.data.name.length;
        let fontSize;
        
        if (compact) {
          fontSize = 10;
        } else if (textLength > 30) {
          fontSize = Math.min(radius / 6, 11);
        } else if (textLength > 20) {
          fontSize = Math.min(radius / 5, 13);
        } else if (textLength > 10) {
          fontSize = Math.min(radius / 4, 15);
        } else {
          fontSize = Math.min(radius / 3, 18);
        }
        
        return fontSize + "px";
      })
      .style("word-wrap", "break-word")
      .style("overflow-wrap", "break-word")
      .style("hyphens", "auto")
      .text(d => d.data.name);

    // Remove percentage labels - they don't make sense in this context

    // Add enhanced hover effects
    bubbleGroups
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        const circle = d3.select(this).select("circle");
        circle
          .transition()
          .duration(200)
          .attr("r", d => sizeScale(d.data.value) * 1.1)
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.5);
          
        // Scale up text on hover
        d3.select(this).select("foreignObject")
          .transition()
          .duration(200)
          .attr("transform", "scale(1.1)");
      })
      .on("mouseout", function(event, d) {
        const circle = d3.select(this).select("circle");
        circle
          .transition()
          .duration(200)
          .attr("r", d => sizeScale(d.data.value))
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.3);
          
        // Reset text scale
        d3.select(this).select("foreignObject")
          .transition()
          .duration(200)
          .attr("transform", "scale(1)");
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      bubbleGroups.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // Add some initial random motion
    simulation.nodes().forEach(node => {
      node.x = Math.random() * width;
      node.y = Math.random() * height;
    });
    simulation.alpha(1).restart();

  }, [data, compact]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center items-center"
    >
      <svg ref={svgRef} className="overflow-visible" />
    </motion.div>
  );
}
