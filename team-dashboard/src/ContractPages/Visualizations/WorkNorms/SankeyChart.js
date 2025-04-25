// src/ContractPages/Visualizations/WorkNorms/SankeyChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

export default function SankeyChart({
  width,
  height,
  rawLinks,
  showMyData,
  currentUserLeftIndex,
  currentUserRightIndex,
}) {
  const svgRef     = useRef();
  const tooltipRef = useRef();
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState(null);

  useEffect(() => {
    /* ---------- 1 · DEFINE NODES & LINKS ---------- */
    const nodes = [
      { id: 0, name: 'Member 1' },
      { id: 1, name: 'Member 2' },
      { id: 2, name: 'Member 3' },
      { id: 3, name: 'Member 4' },
      { id: 4, name: 'Member 1' },
      { id: 5, name: 'Member 2' },
      { id: 6, name: 'Member 3' },
      { id: 7, name: 'Member 4' },
    ];

    const links = rawLinks
      .filter(d => d.i !== d.j)
      .map(d => ({
        source: d.i,
        target: d.j + 4,   // right column
        value:  d.value,
      }));

    /* ---------- 2 · CLEAN & TOOLTIP ---------- */
    d3.select(svgRef.current).selectAll('*').remove();

    let tooltip = d3.select(tooltipRef.current);
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('class', 'sankey-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', '#fff')
        .style('border', '1px solid #ccc')
        .style('padding', '6px 8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none');
      tooltipRef.current = tooltip.node();
    }

    /* ---------- 3 · SANKEY GEN ---------- */
    const sankeyGen = sankey()
      .nodeId(d => d.id)
      .nodeWidth(15)
      .nodePadding(20)
      .nodeAlign(n => (n.id < 4 ? 0 : 2))  // fixed two columns
      .nodeSort((a, b) => a.id - b.id)      // keep 0‑3, 4‑7 order
      .extent([[0, 0], [width, height]]);

    const graph = sankeyGen({
      nodes: nodes.map(n => ({ ...n })),
      links: links.map(l => ({ ...l })),
    });

    const svg = d3.select(svgRef.current)
      .attr('width',  width)
      .attr('height', height);

    /* ---------- 4 · LINKS ---------- */
    const memberColors   = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const givingColor    = '#FF9999';
    const receivingColor = '#9999FF';
    const defaultLink    = '#d0d0d0';

    svg.append('g')
      .selectAll('path')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (showMyData) {
          if (d.source.id === currentUserLeftIndex)  return givingColor;
          if (d.target.id === currentUserRightIndex) return receivingColor;
        }
        return defaultLink;
      })
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', d =>
        hoveredLinkIndex != null && hoveredLinkIndex !== graph.links.indexOf(d) ? 0.25 : 0.8
      )
      .on('mouseover', (event, d) => {
        setHoveredLinkIndex(graph.links.indexOf(d));
        const src = nodes[d.source.id].name;
        const dst = nodes[d.target.id].name;
        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${src} → ${dst}</strong><br/>${d.value} comments`);
      })
      .on('mousemove', event => {
        tooltip
          .style('top',  `${event.pageY + 12}px`)
          .style('left', `${event.pageX + 12}px`);
      })
      .on('mouseout', () => {
        setHoveredLinkIndex(null);
        tooltip.style('visibility', 'hidden');
      });

    /* ---------- 5 · NODES & LABELS ---------- */
    const nodeG = svg.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .enter()
      .append('g');

    // rectangles
    nodeG.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width',  d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => memberColors[d.id % 4])
      .attr('stroke', '#666');

    // text labels
    nodeG.append('text')
      .attr('dy', '0.35em')
      .attr('x',  d => (d.id < 4 ? d.x0 - 10 : d.x1 + 10)) // left or right offset
      .attr('y',  d => (d.y0 + d.y1) / 2)
      .attr('text-anchor', d => (d.id < 4 ? 'end' : 'start'))
      .style('font-size', 12)
      .style('font-family', 'sans-serif')
      .text(d => d.name);

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
