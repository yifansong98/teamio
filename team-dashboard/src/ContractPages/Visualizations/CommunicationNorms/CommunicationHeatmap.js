// src/ContractPages/ContractReflection/CommunicationHeatmap.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

/**
 * CommunicationHeatmap
 * Rows = days (Day 1..7)
 * Columns = conversation slots (0..3)
 * Each cell => {
 *   participants: number (0..4),
 *   messages: number,
 *   firstTs: string,
 *   lastTs: string,
 *   myInvolved: boolean (did the current user participate?)
 * }
 * 
 * Show my data => highlight any cell with myInvolved == true using a bold red border.
 * 
 * The color scale is green from light to dark for participants=1..4, white for 0.
 * There's extra spacing below the grid, the legend is centered, and a "Show my data" 
 * checkbox is placed below the entire chart.
 */

export default function CommunicationHeatmap({
  width = 500,
  height = 400,
}) {
  const svgRef = useRef();
  const tooltipRef = useRef();

  // Local state: show my data => highlight myInvolved cells with bold red border
  const [showMyData, setShowMyData] = useState(false);

  useEffect(() => {
    // 1) Dummy data: 7 days, each with 4 conversation slots
    // We'll add "myInvolved: boolean" to each cell to represent 
    // whether the current user participated.
    const data = [
      // Day 1
      [
        { participants: 3, messages: 10, firstTs: "09:00", lastTs: "09:30", myInvolved: true },
        { participants: 2, messages: 5, firstTs: "10:15", lastTs: "10:30", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
      ],
      // Day 2
      [
        { participants: 4, messages: 12, firstTs: "08:00", lastTs: "08:40", myInvolved: true },
        { participants: 1, messages: 2, firstTs: "09:10", lastTs: "09:15", myInvolved: false },
        { participants: 3, messages: 6, firstTs: "14:00", lastTs: "14:20", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
      ],
      // Day 3
      [
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 2, messages: 5, firstTs: "11:00", lastTs: "11:25", myInvolved: true },
        { participants: 4, messages: 8, firstTs: "16:00", lastTs: "16:45", myInvolved: true },
        { participants: 1, messages: 2, firstTs: "20:10", lastTs: "20:20", myInvolved: false },
      ],
      // Day 4
      [
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
      ],
      // Day 5
      [
        { participants: 2, messages: 4, firstTs: "09:50", lastTs: "10:00", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
        { participants: 0, messages: 0, firstTs: "", lastTs: "", myInvolved: false },
      ],
      // Day 6
      [
        { participants: 4, messages: 15, firstTs: "08:30", lastTs: "09:10", myInvolved: true },
        { participants: 4, messages: 9, firstTs: "13:00", lastTs: "13:25", myInvolved: true },
        { participants: 3, messages: 5, firstTs: "14:00", lastTs: "14:10", myInvolved: false },
        { participants: 2, messages: 3, firstTs: "18:00", lastTs: "18:05", myInvolved: false },
      ],
      // Day 7
      [
        { participants: 1, messages: 1, firstTs: "07:00", lastTs: "07:05", myInvolved: false },
        { participants: 2, messages: 4, firstTs: "10:00", lastTs: "10:20", myInvolved: true },
        { participants: 3, messages: 6, firstTs: "16:00", lastTs: "16:30", myInvolved: true },
        { participants: 4, messages: 12, firstTs: "21:00", lastTs: "21:40", myInvolved: true },
      ],
    ];

    const numRows = data.length;    // 7 days
    const numCols = data[0].length; // 4 conversation slots

    // 2) Clear any previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create or select tooltip
    let tooltip = d3.select(tooltipRef.current);
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "heatmap-tooltip")
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

    // 3) Define margins, compute inner dims
    const margin = { top: 40, right: 20, bottom: 100, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const cellWidth = innerWidth / numCols;
    const cellHeight = innerHeight / numRows;

    // 4) Create SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 5) Define color scale (GitHub-like green)
    // 0 => white, 1..4 => from light to dark
    const colorRange = ["#ebfbee", "#c6f6d5", "#9ae6b4", "#68d391", "#38a169"];
    const colorScale = d3.scaleQuantize()
      .domain([1, 4])  // 1..4 participants
      .range(colorRange);

    // 6) Draw cells
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      for (let colIndex = 0; colIndex < numCols; colIndex++) {
        const cellData = data[rowIndex][colIndex];
        const { participants, messages, firstTs, lastTs, myInvolved } = cellData;

        const x = colIndex * cellWidth;
        const y = rowIndex * cellHeight;

        let fillColor = "#fff"; // default if participants=0
        if (participants > 0) {
          fillColor = colorScale(participants);
        }

        // If showMyData is checked and myInvolved => highlight border
        let strokeColor = "#ccc";
        let strokeWidth = 1;
        if (showMyData && myInvolved) {
          strokeColor = "#f44336"; 
          strokeWidth = 2;
        }

        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", cellWidth)
          .attr("height", cellHeight)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", strokeWidth)
          .on("mouseover", (event) => {
            if (participants > 0) {
              tooltip.style("visibility", "visible")
                .html(`
                  <strong>Day ${rowIndex + 1}</strong><br/>
                  from ${firstTs || "??"} to ${lastTs || "??"}<br/>
                  ${participants} participants, ${messages} messages
                `);
            }
          })
          .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY + 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          })
          .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
          });
      }
    }

    // 7) Row labels => Days
    const yLabels = d3.range(1, numRows + 1).map(d => "Day " + d);
    g.selectAll(".rowLabel")
      .data(yLabels)
      .enter()
      .append("text")
      .attr("x", -6)
      .attr("y", (d, i) => i * cellHeight + cellHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .text(d => d);

    // 8) Column labels => Convo #1..4
    const xLabels = ["Convo 1", "Convo 2", "Convo 3", "Convo 4"];
    g.selectAll(".colLabel")
      .data(xLabels)
      .enter()
      .append("text")
      .attr("x", (d, i) => i * cellWidth + cellWidth / 2)
      .attr("y", -6)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => d);

    // 9) Legend: we place it centered below the grid
    // We'll define some offset from bottom
    const legendGroup = svg.append("g")
      .attr("class", "legendGroup");

    const legendTitle = "# of Participants";
    const legendData = [1, 2, 3, 4];

    // We'll compute total legend width, then center it
    const legendItemWidth = 30;
    const legendSpacing = 10;
    const totalLegendWidth = legendData.length * (legendItemWidth + legendSpacing) + 40; // plus space for "0"

    // We'll place it at x = (width - totalLegendWidth)/2, y= (height - margin.bottom + 30)
    const legendX = (width - totalLegendWidth) / 2;
    const legendY = height - margin.bottom + 30;

    legendGroup.attr("transform", `translate(${legendX}, ${legendY})`);

    // Title
    legendGroup.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(legendTitle);

    // We'll place squares starting at x=0, y=10
    legendGroup.selectAll("rect.legendSquare")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("class", "legendSquare")
      .attr("x", (d, i) => i * (legendItemWidth + legendSpacing))
      .attr("y", 10)
      .attr("width", legendItemWidth)
      .attr("height", 15)
      .attr("fill", d => colorScale(d));

    // We'll label each square with the number
    legendGroup.selectAll("text.legendLabel")
      .data(legendData)
      .enter()
      .append("text")
      .attr("class", "legendLabel")
      .attr("x", (d, i) => i * (legendItemWidth + legendSpacing) + legendItemWidth / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => d);

    // We'll also add a "0" box => white
    const zeroX = legendData.length * (legendItemWidth + legendSpacing);
    legendGroup.append("rect")
      .attr("x", zeroX)
      .attr("y", 10)
      .attr("width", legendItemWidth)
      .attr("height", 15)
      .attr("fill", "#fff")
      .attr("stroke", "#ccc");

    legendGroup.append("text")
      .attr("x", zeroX + legendItemWidth / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("0");

  }, [width, height, showMyData]);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg ref={svgRef} />
      {/* "Show my data" checkbox below */}
      <div style={{ marginTop: '1rem' }}>
        <label style={{ fontSize: '1rem', color: '#333' }}>
          <input
            type="checkbox"
            checked={showMyData}
            onChange={(e) => setShowMyData(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Show my data
        </label>
      </div>
    </div>
  );
}
