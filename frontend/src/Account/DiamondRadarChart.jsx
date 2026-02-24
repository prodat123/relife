import React, { useRef } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faDownload,
  faShareAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useTooltip } from "../Miscellaneous/TooltipProvider";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const DiamondRadarChart = ({ stats }) => {
  const chartRef = useRef(null);
  const { hideTooltip, showTooltip } = useTooltip();

  // Inside your DiamondRadarChart component
  // Inside your DiamondRadarChart component
  const statLabels = ["Strength", "Intelligence", "Endurance", "Bravery"];

  const data = {
    labels: ["Str.", "Int.", "End.", "Brav."],
    datasets: [
      {
        label: "Your Stats",
        data: [
          stats.strength || 0,
          stats.intelligence || 0,
          stats.endurance || 0,
          stats.bravery || 0,
        ],
        // --- NEW BLUE RADIAL GRADIENT ---
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return "rgba(56, 189, 248, 0.2)"; // Fallback blue
          }
          const gradient = ctx.createRadialGradient(
            chartArea.width / 2,
            chartArea.height / 2,
            0,
            chartArea.width / 2,
            chartArea.height / 2,
            Math.max(chartArea.width, chartArea.height) / 2
          );
          // From a bright inner cyan to a deeper outer blue
          gradient.addColorStop(0, "rgba(103, 232, 249, 0.7)"); // Bright Cyan (Core)
          gradient.addColorStop(0.5, "rgba(56, 189, 248, 0.4)"); // Sky Blue
          gradient.addColorStop(1, "rgba(14, 116, 144, 0.2)"); // Fading Dark Teal (Outer Edge)
          return gradient;
        },
        borderColor: "rgb(34, 211, 238)", // Bright Cyan for a vibrant line
        pointBackgroundColor: "rgb(207, 250, 254)", // Almost white-cyan for bright points
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const maxStat = Math.max(
    stats.strength,
    stats.intelligence,
    stats.bravery,
    stats.endurance
  );
  const suggestedMax = Math.ceil(maxStat * 1.1);

  // Inside your DiamondRadarChart component, update the options
  const options = {
    responsive: true,
    scales: {
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.2)", // This can stay white
        },
        suggestedMin: 0,
        suggestedMax: suggestedMax,
        pointLabels: {
          color: "white",
          font: { size: 16, family: "Space Mono", weight: "bold" },
        },
        ticks: {
          display: false,
          backdropColor: "rgba(0,0,0,0)",
        },
        // --- NEW BLUE GRID ---
        grid: {
          color: "rgba(34, 211, 238, 0.2)", // Grid lines match the new aura color
        },
      },
    },
    plugins: {
      legend: { display: false },
      // 3. Disable the default Chart.js tooltip
      tooltip: {
        enabled: false,

        // 4. Use `external` to trigger your custom tooltip
        external: (context) => {
          const tooltipModel = context.tooltip;

          // Hide the tooltip if the mouse leaves the chart
          if (tooltipModel.opacity === 0) {
            hideTooltip();
            return;
          }

          const activeElement = tooltipModel.dataPoints[0];
          if (!activeElement) {
            hideTooltip();
            return;
          }

          const index = activeElement.dataIndex;
          const value = activeElement.raw;
          const label = statLabels[index];

          // Create the content object for your custom tooltip
          const tooltipContent = {
            name: label,
            rarity: "Uncommon", // You can customize this
            description: `You have ${value} points in ${label}.`,
            stats: { [label.toLowerCase()]: value },
          };

          showTooltip(tooltipContent);
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        hitRadius: 20,
      },
    },
  };

  return (
    <div>
      <div className="w-full lg:aspect-[4/3] md:aspect-[2/2] lg:aspect-square aspect-square rounded-md">
        <Radar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default DiamondRadarChart;
