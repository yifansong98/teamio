// src/ContractPages/Visualizations/WorkNorms/SankeyChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

/**
 * SankeyChart
 * A subcomponent that implements a 2-column sankey for 4 members:
 *   0..3 => left, 4..7 => right
 * Each link is { source, target, value }, i => j+4
 * 
 * "Show my data" highlights only the flows if they involve the current user,
 * but does NOT change node color.
 */
export default function SankeyChart({
  width,
  height,
  rawLinks,
  showMyData,
  currentUserLeftIndex,
  currentUserRightIndex,
}) {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState(null);

  useEffect(() => {
    // 1) Define 8 nodes: 0..3 => left, 4..7 => right
    const nodes = [
      { id: 0, name: "Member 1 (L)" },
      { id: 1, name: "Member 2 (L)" },
      { id: 2, name: "Member 3 (L)" },
      { id: 3, name: "Member 4 (L)" },
      { id: 4, name: "Member 1 (R)" },
      { id: 5, name: "Member 2 (R)" },
      { id: 6, name: "Member 3 (R)" },
      { id: 7, name: "Member 4 (R)" },
    ];

    // 2) Convert rawLinks => sankey links => i-> j+4
    const links = rawLinks
      .filter(d => d.i !== d.j)
      .map(d => ({
        source: d.i,
        target: d.j + 4,
        value: d.value,
      }));

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // Create or select tooltip
    let tooltip = d3.select(tooltipRef.current);
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "sankey-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none");
      tooltipRef.current = tooltip.node();
    }

    // 3) Define sankey
    const sankeyGenerator = sankey()
      .nodeId(d => d.id)
      .nodeWidth(15)
      .nodePadding(20)
      .nodeAlign(node => (node.id < 4 ? 0 : 2))
      .nodeSort((a, b) => a.id - b.id)
      .extent([[0, 0], [width, height]]);

    const graph = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d })),
    });

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Colors for members, consistent with your pie chart
    const memberColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
    // We'll use one highlight color for flows. 
    // Or define two if you want giving vs receiving to differ (light red, light blue).
    const givingColor = "#FF9999";    // flows from current user
    const receivingColor = "#9999FF"; // flows to current user
    const defaultLinkColor = "#ccc";

    // 4) Draw links
    svg.append("g")
      .selectAll("path")
      .data(graph.links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d, i) => {
        if (showMyData) {
          // If the current user is the source => giving color
          if (d.source.id === currentUserLeftIndex) {
            return givingColor;
          }
          // If the current user is the target => receiving color
          if (d.target.id === currentUserRightIndex) {
            return receivingColor;
          }
        }
        return defaultLinkColor;
      })
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke-opacity", (d, i) => {
        if (hoveredLinkIndex != null) {
          return i === hoveredLinkIndex ? 1 : 0.3;
        }
        return 0.8;
      })
      .on("mouseover", (event, d) => {
        const idx = graph.links.indexOf(d);
        setHoveredLinkIndex(idx);
        d3.select(event.currentTarget).raise();

        const leftName = graph.nodes[d.source.id].name.replace(" (L)", "");
        const rightName = graph.nodes[d.target.id].name.replace(" (R)", "");
        tooltip.style("visibility", "visible")
          .html(`<strong>${leftName} → ${rightName}</strong><br/>${d.value} comments`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        setHoveredLinkIndex(null);
        tooltip.style("visibility", "hidden");
      });

    // 5) Draw nodes (same color left & right for the same member)
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(graph.nodes)
      .enter()
      .append("g");

    nodeGroup.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => {
        // left side => baseIndex = d.id
        // right side => baseIndex = d.id - 4
        let baseIndex = d.id < 4 ? d.id : d.id - 4;
        return memberColors[baseIndex];
      })
      .attr("stroke", "#666");

    // Node labels
    nodeGroup.append("text")
      .attr("x", d => d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(d => d.name.replace(" (L)", "").replace(" (R)", ""))
      .style("font-weight", "normal") // no highlight on nodes
      // If node is on the right side, place label to the right
      .filter(d => d.x0 > width / 2)
      .attr("x", d => d.x1 + 6)
      .attr("text-anchor", "start");

  }, [
    width,
    height,
    rawLinks,
    showMyData,
    currentUserLeftIndex,
    currentUserRightIndex,
    hoveredLinkIndex,
  ]);

  return <svg ref={svgRef} />;
}
