// src/ContractPages/Visualizations/WorkNorms/CommentSankey.js
import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

export default function CommentSankey() {
  /* ---------- state for tabs & highlight ---------- */
  const tabs = [
    { key: 'google',  label: 'Google Docs (Comments)' },
    { key: 'github',  label: 'GitHub (Pull Request Reviews)' },
  ];
  const [activeTab, setActiveTab]   = useState('google');
  const [showMine, setShowMine]     = useState(false);

  /* ---------- toy demo data ---------- */
  const dataSets = {
    google: [
      { i: 0, j: 1, value: 5 }, { i: 0, j: 2, value: 2 },
      { i: 1, j: 0, value: 3 }, { i: 1, j: 2, value: 4 },
      { i: 2, j: 1, value: 6 }, { i: 2, j: 3, value: 2 },
      { i: 3, j: 0, value: 1 }, { i: 3, j: 2, value: 5 },
    ],
    github: [
      { i: 0, j: 1, value: 10 }, { i: 0, j: 2, value: 3 },
      { i: 1, j: 2, value: 4 },  { i: 1, j: 3, value: 2 },
      { i: 2, j: 0, value: 2 },  { i: 2, j: 1, value: 6 },
      { i: 2, j: 3, value: 5 },  { i: 3, j: 2, value: 3 },
    ],
  };

  /* ---------- current user id for highlight ---------- */
  const youL = 2; // Member 3 left side
  const youR = 6; // Member 3 right side

  /* ---------- D3 drawing ---------- */
  const svgRef      = useRef(null);
  const tooltipRef  = useRef(null);
  const [hoverIdx,setHoverIdx] = useState(null);
  const width = 500, height = 320;

  useEffect(() => {
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    svg.selectAll('*').remove();                                      // reset

    /* ---- build graph ---- */
    const nodes = [
      ...Array.from({ length: 4 }, (_, idx) => ({ id: idx,     name: `Member ${idx+1}` })),
      ...Array.from({ length: 4 }, (_, idx) => ({ id: idx + 4, name: `Member ${idx+1}` })),
    ];
    const links = dataSets[activeTab]
      .filter(l => l.i !== l.j)
      .map(l => ({ source: l.i, target: l.j + 4, value: l.value }));

    const sankeyGen = sankey()
      .nodeId(d => d.id)
      .nodeWidth(16)
      .nodePadding(24)
      .nodeAlign(n => (n.id < 4 ? 0 : 2))
      .extent([[0,0],[width,height]]);

    const graph = sankeyGen({ nodes: nodes.map(n=>({...n})), links: links.map(l=>({...l})) });

    /* ---- color helpers ---- */
    const memberColors  = ['#0088FE','#00C49F','#FFBB28','#FF8042'];
    const givingColor   = '#FF9999';
    const receiveColor  = '#9999FF';

    /* ---- draw links ---- */
    svg.append('g').selectAll('path')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill','none')
      .attr('stroke', d => {
        if (showMine) {
          if (d.source.id === youL)  return givingColor;
          if (d.target.id === youR)  return receiveColor;
        }
        return '#d3d3d3';
      })
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', d => hoverIdx != null ? (graph.links.indexOf(d)===hoverIdx?1:0.25):0.8)
      .on('mouseover', (evt,d) => {
        setHoverIdx(graph.links.indexOf(d));
        tooltip().style('visibility','visible')
                 .html(`<b>${nodes[d.source.id].name} → ${nodes[d.target.id].name}</b><br>${d.value} comments`)
      })
      .on('mousemove', evt => tooltip().style('top',evt.pageY+10+'px').style('left',evt.pageX+10+'px'))
      .on('mouseout', () => { setHoverIdx(null); tooltip().style('visibility','hidden'); });

    /* ---- draw nodes ---- */
    const nodeG = svg.append('g').selectAll('g').data(graph.nodes).enter().append('g');

    nodeG.append('rect')
      .attr('x',d=>d.x0).attr('y',d=>d.y0)
      .attr('width',d=>d.x1-d.x0).attr('height',d=>d.y1-d.y0)
      .attr('fill',d=>memberColors[d.id%4]).attr('stroke','#666');

    nodeG.append('text')
      .attr('x',d=>d.x0>width/2 ? d.x1+8 : d.x0-8)
      .attr('y',d=>(d.y0+d.y1)/2)
      .attr('dy','0.35em')
      .attr('text-anchor',d=>d.x0>width/2?'start':'end')
      .style('font-size','12px')
      .text(d=>d.name);

    /* ---- helper: tooltip el ---- */
    function tooltip() {
      if (!tooltipRef.current) {
        tooltipRef.current = d3.select('body').append('div')
          .style('position','absolute').style('visibility','hidden')
          .style('background','#fff').style('border','1px solid #ccc')
          .style('padding','6px 8px').style('border-radius','4px')
          .style('font-size','12px').style('pointer-events','none')
          .node();
      }
      return d3.select(tooltipRef.current);
    }
  }, [activeTab, showMine, hoverIdx]);

  /* ---------- JSX ---------- */
  return (
    <div style={{ textAlign:'center' }}>
      {/* Tabs */}
      <div style={{ margin:'0 0 1rem' }}>
        {tabs.map(({key,label}) => (
          <button
            key={key}
            onClick={()=>setActiveTab(key)}
            style={{
              padding:'0.5rem 1rem',
              marginRight:'0.8rem',
              background: activeTab===key ? '#3182ce' : '#ccc',
              color:      activeTab===key ? '#fff' : '#000',
              border:'none', borderRadius:4, cursor:'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <svg ref={svgRef} />

      {/* “Show my data” */}
      <div style={{ margin:'1rem 0' }}>
        <label>
          <input
            type="checkbox"
            checked={showMine}
            onChange={()=>setShowMine(!showMine)}
            style={{ marginRight:6 }}
          />
          Show my data
        </label>
      </div>
    </div>
  );
}
