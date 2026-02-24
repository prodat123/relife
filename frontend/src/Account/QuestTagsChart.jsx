import { useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 120);
  const b = Math.floor(Math.random() * 250);
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

const QuestTagsChart = ({ tags }) => {
  const chartRef = useRef(null);
  const labels = Object.keys(tags);
  const values = Object.values(tags);
  const total = values.reduce((sum, val) => sum + val, 0);
  const colors = labels.map(() => getRandomColor());

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tag Count',
        data: values,
        backgroundColor: colors,
        borderColor: 'white',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        font: { size: 18, weight: 'bold' },
        color: 'white'
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${tooltipItem.label}: ${value} quests (${percentage}%)`;
          }
        },
        bodyColor: 'white',
        titleColor: 'white'
      },
      legend: {
        labels: {
          color: 'white'
        }
      },
      datalabels: {
        color: 'white',
        font: {
          weight: 'bold'
        },
        formatter: (value) => {
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        }
      }
    }
  };

  // 📥 Function to handle download
  const handleDownload = () => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quest-tags-chart.png';
      link.click();
    }
  };

  return (
    <div>
      <div className="group relative w-full p-6 mb-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 
        rounded-md shadow-[0_0_30px_rgba(0,0,0,0.6)] cursor-pointer transition-all 
        border border-blue-500/20 overflow-hidden 
        hover:shadow-[0_0_50px_rgba(59,130,246,0.7)]"
        style={{
          animation: 'pulseGlow 3s infinite ease-in-out',
        }}
      >
        <h1 className='font-solo tracking-wider text-2xl font-bold text-center'>Quest Tags Distribution</h1>
        <div className="w-full aspect-[1/1]">
          <Pie ref={chartRef} data={chartData} options={options} />
        </div>

        <div className="w-full lg:w-1/2 text-white text-sm space-y-2">
          <h2 className="text-lg font-bold mb-2">Tag Breakdown</h2>
          {labels.map((label, index) => {
            const value = tags[label];
            const percentage = ((value / total) * 100).toFixed(1);
            return (
              <div
                key={label}
                className="flex items-center justify-between border-b border-white/10 pb-1"
              >
                <span>
                  <span
                    className="inline-block w-3 h-3 mr-2 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  ></span>
                  {label}
                </span>
                <span>{value} ({percentage}%)</span>
              </div>
            );
          })}

      <button
        onClick={handleDownload}
        className="mt-4 text-xs bg-primary hover:bg-blue-400 text-white py-1 px-2 rounded-md"
      >
        <FontAwesomeIcon icon={faDownload} /> Download Chart
      </button>

          
        </div>      
      </div>
      
    </div>
  );
};

export default QuestTagsChart;
