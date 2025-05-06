import React, { useRef } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faDownload, faShareAlt } from '@fortawesome/free-solid-svg-icons';

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

  const data = {
    labels: ['Strength', 'Intelligence', 'Endurance', 'Bravery'],
    datasets: [
      {
        label: 'Your Stats',
        data: [
          stats.strength || 0,
          stats.intelligence || 0,
          stats.endurance || 0,
          stats.bravery || 0,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(57, 73, 171)',
        pointBackgroundColor: 'rgb(57, 73, 171)',
        borderWidth: 2,
        fill: true,
      }
    ],
  };

  const maxStat = Math.max(
    stats.strength,
    stats.intelligence,
    stats.bravery,
    stats.endurance
  );
  const suggestedMax = Math.ceil(maxStat * 1.1);

  const options = {
    responsive: true,
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: suggestedMax,
        pointLabels: {
          color: 'white',
          font: () => {
            const screenWidth = window.innerWidth;
            let size = 10;
            if (screenWidth >= 768) size = 14;
            if (screenWidth >= 1024) size = 18;
            return {
              size,
              family: 'Space Mono',
              weight: 'bold',
            };
          }
        },
        ticks: {
          display: true,
          color: 'white',
          font: {
            size: 12,
            family: 'Space Mono',
            weight: 'bold',
          },
          backdropColor: 'rgba(0,0,0,0)',
        },
        grid: { color: 'rgba(255,255,255,0.5)' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const getChartWithBackground = (chart, backgroundColor = '#000000') => {
    const width = chart.width;
    const height = chart.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(chart.canvas, 0, 0, width, height);

    return canvas;
  };

  const handleDownload = () => {
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = getChartWithBackground(chart);
    const image = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = image;
    link.download = 'stats-chart.png';
    link.click();
  };

  const handleNativeShare = async () => {
    const chart = chartRef.current;
    if (!chart) return;

    try {
      const base64Image = chart.toBase64Image();
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], 'stats-chart.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Check out my stats!',
          text: 'Here’s my awesome radar chart!',
          files: [file],
        });
      } else {
        alert('Sharing not supported on this browser or device.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Something went wrong while sharing.');
    }
  };

  const copyChartToClipboard = async () => {
    const chart = chartRef.current;
    if (!chart) return;

    try {
      const canvas = getChartWithBackground(chart);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      alert('Performace Radar Chart copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy chart.');
    }
  };

  const openShareLink = (platform) => {
    const url = chartRef.current.toBase64Image();
    const shareText = encodeURIComponent('Check out my stat chart!');

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${shareText}`, '_blank');
        break;
      case 'instagram':
        alert('Instagram does not support web image sharing. Please download the image and upload it via the app.');
        break;
      default:
        break;
    }
  };

  const isMobile = window.innerWidth < 768;

//   const valueLabelPlugin = {
//     id: 'valueLabels',
//     afterDatasetsDraw: (chart) => {
//       const { ctx, data, chartArea: { top }, scales } = chart;
  
//       chart.data.datasets.forEach((dataset, datasetIndex) => {
//         const meta = chart.getDatasetMeta(datasetIndex);
//         meta.data.forEach((point, index) => {
//           const value = dataset.data[index];
//           ctx.save();
//           ctx.font = 'bold 12px Space Mono';
//           ctx.fillStyle = '#fff';
//           ctx.textAlign = 'center';
//           ctx.textBaseline = 'middle';
  
//           const { x, y } = point.tooltipPosition();
//           ctx.fillText(value, x, y - 10);
//           ctx.restore();
//         });
//       });
//     }
//   };
  

    return (
        <div className="flex flex-col items-center justify-center rounded-md w-full mx-auto p-3 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-white space-y-6">

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-semibold text-center tracking-wide">
                Performance Radar Chart
            </h2>

            {/* Chart */}
            <div className="w-full aspect-square rounded-md shadow-inner">
                <Radar ref={chartRef} data={data} options={options} />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
                <button
                onClick={handleDownload}
                className="bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 text-white text-sm py-1 px-2 rounded-md flex items-center gap-2 shadow-md"
                >
                <FontAwesomeIcon icon={faDownload} />
                <span>Download</span>
                </button>

                <button
                onClick={copyChartToClipboard}
                className="bg-green-500 hover:bg-green-400 transition-all duration-200 text-white text-sm py-1 px-2 rounded-md flex items-center gap-2 shadow-md"
                >
                <FontAwesomeIcon icon={faCopy} />
                <span>Copy</span>
                </button>

                {isMobile && (
                <button
                    onClick={handleNativeShare}
                    className="bg-purple-600 hover:bg-purple-500 transition-all duration-200 text-white py-2 px-4 rounded-md flex items-center gap-2 shadow-md"
                >
                    <FontAwesomeIcon icon={faShareAlt} />
                    <span>Share</span>
                </button>
                )}
            </div>
        </div>

  );
};

export default DiamondRadarChart;
