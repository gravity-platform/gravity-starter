import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Network, Brain } from 'lucide-react';

export function MemoryNetwork({ memories }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!memories || memories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    // Create nodes from memories and their tags
    const nodes = [];
    const links = [];
    const tagMap = new Map();

    // Add memory nodes
    memories.forEach((memory, i) => {
      nodes.push({
        id: `memory-${i}`,
        type: 'memory',
        data: memory,
        radius: 20 + memory.importance * 30
      });

      // Process tags
      memory.tags.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            id: `tag-${tag}`,
            type: 'tag',
            name: tag,
            radius: 15,
            count: 0
          });
        }
        tagMap.get(tag).count++;

        // Create link between memory and tag
        links.push({
          source: `memory-${i}`,
          target: `tag-${tag}`,
          value: memory.importance
        });
      });
    });

    // Add tag nodes
    tagMap.forEach(tagNode => {
      tagNode.radius = 10 + Math.sqrt(tagNode.count) * 5;
      nodes.push(tagNode);
    });

    // Create color scales
    const memoryColorScale = d3.scaleSequential()
      .domain([0, 1])
      .interpolator(t => d3.interpolateRgb("#E5E5E7", "#007AFF")(t));

    const sentimentColors = {
      positive: '#34C759',
      neutral: '#8E8E93',
      negative: '#FF3B30'
    };

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 5));

    // Create main group
    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#E5E5E7")
      .attr("stroke-width", d => d.value * 2)
      .attr("stroke-dasharray", "2,2");

    // Create node groups
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles for nodes
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => {
        if (d.type === 'memory') {
          return memoryColorScale(d.data.importance);
        } else {
          return "#007AFF";
        }
      })
      .attr("stroke", d => {
        if (d.type === 'memory' && d.data.sentiment) {
          return sentimentColors[d.data.sentiment];
        }
        return "#E5E5E7";
      })
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .attr("opacity", 0.8);

    // Add icons or text
    node.each(function(d) {
      const g = d3.select(this);
      
      if (d.type === 'memory') {
        // Add importance indicator
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.3em")
          .attr("fill", d.data.importance > 0.5 ? "white" : "#1D1D1F")
          .attr("font-size", "13px")
          .attr("font-weight", "600")
          .text(`${Math.round(d.data.importance * 100)}%`);
      } else {
        // Tag node
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.3em")
          .attr("fill", "white")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .text(d.name);
      }
    });

    // Add hover effects
    node.on("mouseover", function(event, d) {
      const nodeElement = d3.select(this);
      
      nodeElement.select("circle")
        .transition()
        .duration(200)
        .attr("opacity", 1)
        .attr("r", d => d.radius * 1.2);

      // Highlight connected links
      link
        .transition()
        .duration(200)
        .attr("stroke", l => {
          if (l.source.id === d.id || l.target.id === d.id) {
            return "#007AFF";
          }
          return "#F2F2F7";
        })
        .attr("stroke-width", l => {
          if (l.source.id === d.id || l.target.id === d.id) {
            return l.value * 3;
          }
          return l.value * 1;
        });

      // Show tooltip for memory nodes
      if (d.type === 'memory') {
        const tooltip = g.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${d.x}, ${d.y - d.radius - 10})`);

        const rect = tooltip.append("rect")
          .attr("x", -100)
          .attr("y", -40)
          .attr("width", 200)
          .attr("height", 40)
          .attr("rx", 4)
          .attr("fill", "white")
          .attr("stroke", "#E5E5E7")
          .attr("stroke-width", 1)
          .style("filter", "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))");

        tooltip.append("text")
          .attr("text-anchor", "middle")
          .attr("y", -15)
          .attr("fill", "#1D1D1F")
          .attr("font-size", "12px")
          .text(d.data.summary.substring(0, 30) + "...");
      }
    })
    .on("mouseout", function(event, d) {
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("opacity", 0.8)
        .attr("r", d.radius);

      link
        .transition()
        .duration(200)
        .attr("stroke", "#E5E5E7")
        .attr("stroke-width", l => l.value * 2);

      g.select(".tooltip").remove();
    });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add legend
    const legend = svg.append("g")
      .attr("transform", "translate(20, 20)");

    const legendItems = [
      { type: 'memory', label: 'Memory', color: memoryColorScale(0.5) },
      { type: 'tag', label: 'Tag', color: "#007AFF" }
    ];

    legendItems.forEach((item, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendRow.append("circle")
        .attr("r", 8)
        .attr("fill", item.color)
        .attr("stroke", "#E5E5E7")
        .attr("stroke-width", 1);

      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 4)
        .attr("fill", "#1D1D1F")
        .attr("font-size", "13px")
        .text(item.label);
    });

  }, [memories]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Network className="w-5 h-5 mr-2 text-gray-400" />
          Memory Network
        </h3>
        <p className="text-sm text-gray-500">
          Drag nodes to explore connections
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <svg ref={svgRef} className="w-full" />
      </div>
    </motion.div>
  );
}
