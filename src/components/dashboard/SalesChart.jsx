import React, { useMemo, useState } from 'react';
import { TrendingUp, Activity, Clock } from 'lucide-react';

const SalesChart = ({ bills }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverLineX, setHoverLineX] = useState(null);

  const chartData = useMemo(() => {
    // Initialize hourly data
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      transactions: 0
    }));

    // Process bills to get hourly sales
    bills.forEach(bill => {
      const hour = new Date(bill.createdAt).getHours();
      hourlyData[hour].sales += bill.total;
      hourlyData[hour].transactions += 1;
    });

    return hourlyData;
  }, [bills]);

  const maxTransactions = Math.max(...chartData.map(d => d.transactions));
  const totalTransactions = chartData.reduce((sum, data) => sum + data.transactions, 0);
  
  // Find all peak hours (multiple hours with same max transactions)
  const peakHours = chartData
    .map((data, index) => ({ ...data, index }))
    .filter(data => data.transactions === maxTransactions && data.transactions > 0)
    .map(data => data.index);

  // Calculate proper Y-axis labels to avoid duplicates
  const getYAxisLabels = (max) => {
    if (max === 0) return [0, 0, 0, 0, 0];
    
    // Find a good step size
    let step;
    if (max <= 4) {
      step = 1;
    } else if (max <= 10) {
      step = Math.ceil(max / 4);
    } else if (max <= 20) {
      step = Math.ceil(max / 4);
    } else if (max <= 50) {
      step = Math.ceil(max / 4 / 5) * 5; // Round to nearest 5
    } else {
      step = Math.ceil(max / 4 / 10) * 10; // Round to nearest 10
    }
    
    const labels = [];
    for (let i = 0; i <= 4; i++) {
      labels.push(Math.min(step * i, max));
    }
    
    // Ensure the last label is the maximum
    labels[4] = max;
    
    return labels.reverse(); // Reverse to show max at top
  };

  const yAxisLabels = getYAxisLabels(maxTransactions);

  const formatHour = (hour) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  const formatHourShort = (hour) => {
    if (hour === 0) return '12AM';
    if (hour === 12) return '12PM';
    if (hour < 12) return `${hour}AM`;
    return `${hour - 12}PM`;
  };

  const getYPosition = (value, max, height) => {
    if (max === 0) return height;
    return (value / max) * height;
  };

  const createPath = () => {
    const height = 80;
    const width = 90;
    const startX = 5;
    const startY = 10;
    let path = '';
    
    chartData.forEach((data, index) => {
      const x = startX + (index / (chartData.length - 1)) * width;
      const y = startY + height - getYPosition(data.transactions, maxTransactions, height);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const createAreaPath = () => {
    const height = 80;
    const width = 90;
    const startX = 5;
    const startY = 10;
    const bottomY = startY + height;
    
    let path = `M ${startX} ${bottomY}`;
    
    chartData.forEach((data, index) => {
      const x = startX + (index / (chartData.length - 1)) * width;
      const y = startY + height - getYPosition(data.transactions, maxTransactions, height);
      
      if (index === 0) {
        path += ` L ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    path += ` L ${startX + width} ${bottomY} Z`;
    return path;
  };

  const handleMouseMove = (e, data, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Calculate the x position for the vertical line
    const x = 5 + (index / (chartData.length - 1)) * 90;
    setHoverLineX(x);
    setHoveredPoint({ data, index });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverLineX(null);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {bills.length === 0 ? (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Transaction Data</h3>
          <p className="text-gray-500 dark:text-gray-400">Sales analytics will appear here once transactions are recorded</p>
        </div>
      ) : (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction Analytics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">24-hour transaction pattern</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTransactions}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="relative mb-6">
            <div className="h-72 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 p-4 pl-20 pb-16 shadow-inner">
              <div className="h-full w-full relative">
                <svg 
                  className="w-full h-full transition-all duration-200" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Background grid */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.1"/>
                      <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.01"/>
                    </linearGradient>
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgb(34, 197, 94)" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="5"
                      y1={10 + (i * 20)}
                      x2="95"
                      y2={10 + (i * 20)}
                      stroke="currentColor"
                      strokeWidth="0.1"
                      className="text-gray-300 dark:text-gray-600"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  
                  {/* Area fill */}
                  <path
                    d={createAreaPath()}
                    fill="url(#areaGradient)"
                    className="transition-all duration-300"
                  />
                  
                  {/* Main line */}
                  <path
                    d={createPath()}
                    fill="none"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth="0.6"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#shadow)"
                    className="transition-all duration-300"
                  />
                  
                  {/* Vertical hover line */}
                  {hoverLineX !== null && (
                    <line
                      x1={hoverLineX}
                      y1="10"
                      x2={hoverLineX}
                      y2="90"
                      stroke="rgb(34, 197, 94)"
                      strokeWidth="0.3"
                      strokeDasharray="2,2"
                      opacity="0.8"
                      vectorEffect="non-scaling-stroke"
                      className="pointer-events-none transition-all duration-200 animate-pulse"
                    />
                  )}
                  
                  {/* Invisible overlay rectangles for better hover detection */}
                  {chartData.map((data, index) => {
                    const x = 5 + (index / (chartData.length - 1)) * 90;
                    const rectWidth = index === 0 || index === chartData.length - 1 ? 2 : 4;
                    
                    return (
                      <rect
                        key={`hover-${index}`}
                        x={x - rectWidth / 2}
                        y="10"
                        width={rectWidth}
                        height="80"
                        fill="transparent"
                        onMouseMove={(e) => handleMouseMove(e, data, index)}
                        className="cursor-pointer"
                      />
                    );
                  })}
                  
                  {/* Data points */}
                  {chartData.map((data, index) => {
                    const x = 5 + (index / (chartData.length - 1)) * 90;
                    const y = 10 + 80 - getYPosition(data.transactions, maxTransactions, 80);
                    const isHovered = hoveredPoint?.index === index;
                    
                    return (
                      <g key={index}>
                        {/* Visible data point */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? "0.8" : "0.4"}
                          fill="white"
                          stroke="rgb(34, 197, 94)"
                          strokeWidth="0.3"
                          vectorEffect="non-scaling-stroke"
                          className="transition-all duration-200 pointer-events-none"
                        />
                        
                        {/* Highlight ring for peak and hovered points */}
                        {(peakHours.includes(index)) || isHovered ? (
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? "1.2" : "0.8"}
                            fill="none"
                            stroke="rgb(34, 197, 94)"
                            strokeWidth="0.2"
                            vectorEffect="non-scaling-stroke"
                            opacity={isHovered ? "1" : "0.6"}
                            className="pointer-events-none"
                          />
                        ) : null}
                      </g>
                    );
                  })}
                </svg>
                
                {/* Tooltip */}
                {hoveredPoint && (
                  <div 
                    className="absolute z-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm rounded-lg px-4 py-3 shadow-xl border border-gray-200 dark:border-gray-600 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${hoverLineX}%`,
                      top: '10px',
                      minWidth: '140px'
                    }}
                  >
                    <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {formatHour(hoveredPoint.data.hour)}
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Transactions:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {hoveredPoint.data.transactions}
                      </span>
                    </div>
                    {hoveredPoint.data.sales > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sales:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          LKR {hoveredPoint.data.sales.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {/* Enhanced tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-gray-600 -mt-[1px]"></div>
                    </div>
                  </div>
                )}
                
                {/* Y-axis title - properly aligned to the left */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs font-semibold text-gray-700 dark:text-gray-300 -ml-20">
                  Transactions
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs font-medium text-gray-600 dark:text-gray-400 -ml-6 py-2">
                  {yAxisLabels.map((label, index) => (
                    <span key={index}>{label}</span>
                  ))}
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="relative mt-2 h-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                {chartData.map((data, index) => {
                  // Show labels for key hours to avoid overcrowding
                  if (index % 3 !== 0) return null;
                  
                  // Calculate the exact position to match the SVG data points
                  const svgX = 5 + (index / (chartData.length - 1)) * 90; // This matches the SVG calculation
                  const percentageX = svgX; // Direct percentage since SVG viewBox is 0-100
                  
                  return (
                    <span 
                      key={index}
                      className="absolute transform -translate-x-1/2"
                      style={{ left: `${percentageX}%` }}
                    >
                      {String(data.hour).padStart(2, '0')}
                    </span>
                  );
                })}
              </div>
              
              {/* X-axis title */}
              <div className="text-center mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                Time (Hours)
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded-full">PEAK</span>
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {peakHours.length > 0 ? (
                  peakHours.length === 1 ? (
                    formatHour(peakHours[0])
                  ) : peakHours.length <= 3 ? (
                    peakHours.map(hour => formatHour(hour)).join(', ')
                  ) : (
                    `${peakHours.length} hours`
                  )
                ) : 'No peak'}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Peak Hour{peakHours.length > 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-800 px-2 py-1 rounded-full">TOTAL</span>
              </div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                {totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Transactions</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded-full">AVG</span>
              </div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {Math.round(totalTransactions / 24).toLocaleString()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Per Hour</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesChart;