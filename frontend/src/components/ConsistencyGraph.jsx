import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

export default function ConsistencyGraph() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
        chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    // MOCK DATA GENERATION -> TODO [SUPABASE]: Hook this up to `tasks` table
    const continuousDates = [];
    const rawEffortData = [];
    const momentumData = [];
    
    // Generate 35 days of mock data mathematically recreating an EMA momentum swing
    let currentMomentum = 0;
    const today = new Date();
    
    for (let i = 34; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        continuousDates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Random effort (simulating some zeros and bursts)
        const dailyYield = Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : 0;
        rawEffortData.push(dailyYield);
        
        // EMA: momentum = (dailyYield × 0.25) + (previousMomentum × 0.75)
        currentMomentum = (dailyYield * 0.25) + (currentMomentum * 0.75);
        momentumData.push(currentMomentum);
    }

    // Determine slope for color (Automated Insight Generation)
    const lastDay = momentumData.length - 1;
    const currentSlope = momentumData[lastDay] - momentumData[lastDay - 3];
    const last3DaysEffort = rawEffortData[lastDay] + rawEffortData[lastDay-1] + rawEffortData[lastDay-2];
    
    let lineColor = '#22c55e'; // Default green (increasing/steady)
    let insight = 'STEADY PROGRESS';
    let insightColorClass = 'text-green-500 border-green-500 bg-green-500/10 shadow-green-500/20';
    let shadowHex = '#22c55e';
    
    // Null / Zero Momentum -> Red
    if (currentMomentum === 0) {
        lineColor = '#ef4444'; // Red
        insight = 'MOMENTUM LOST'; 
        insightColorClass = 'text-red-500 border-red-500 bg-red-500/10 shadow-red-500/20'; 
        shadowHex = '#ef4444';
    } 
    // Decreasing Momentum -> Orange (Warning)
    else if (currentSlope < -0.1) {
        lineColor = '#f97316'; // Orange
        insight = 'MOMENTUM DECAY'; 
        insightColorClass = 'text-orange-500 border-orange-500 bg-orange-500/10 shadow-orange-500/20'; 
        shadowHex = '#f97316';
    } 
    // Highly Increasing Momentum -> Emerald
    else if (last3DaysEffort > 0 && currentSlope > 0.5) {
        lineColor = '#10b981'; // Emerald
        insight = 'STRONG MOMENTUM'; 
        insightColorClass = 'text-emerald-500 border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20'; 
        shadowHex = '#10b981';
    } 
    // Stable / Plateau -> Default Green
    else if (last3DaysEffort > 0 && Math.abs(currentSlope) <= 0.2) {
        // Keeps default green colors
        insight = 'SKILL PLATEAU'; 
    }

    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    const hexToRgb = hex => {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };
    
    const rgb = hexToRgb(lineColor);
    gradient.addColorStop(0, `rgba(${rgb}, 0.5)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0.01)`);

    chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
            labels: continuousDates,
            datasets: [
                {
                    type: 'line',
                    label: 'Momentum Index (EMA)',
                    data: momentumData,
                    borderColor: lineColor,
                    backgroundColor: gradient,
                    borderWidth: 5, 
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: lineColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    order: 1
                },
                {
                    type: 'bar',
                    label: 'Daily Raw Effort',
                    data: rawEffortData,
                    backgroundColor: 'rgba(0,0,0,0.06)', 
                    borderWidth: 0,
                    borderRadius: 4,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#cbd5e1',
                    bodyColor: '#fff',
                    titleFont: { family: 'monospace', size: 10, weight: 'bold' },
                    bodyFont: { family: 'sans-serif', size: 14, weight: 'bold' },
                    borderColor: lineColor,
                    borderWidth: 2,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                },
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: {
                        wheel: { enabled: true, speed: 0.1 },
                        pinch: { enabled: true },
                        mode: 'x'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.04)', tickLength: 0 },
                    border: { display: false },
                    ticks: { display: false, max: Math.max(...momentumData) + 1 } 
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    border: { display: false },
                    ticks: { 
                        maxTicksLimit: 6, 
                        color: 'rgba(0,0,0,0.4)', 
                        font: { family: 'monospace', weight: 'bold', size: 10 },
                        padding: 10
                    }
                }
            }
        }
    });

    const chartDOM = document.getElementById('dpi-insight-badge');
    if (chartDOM) {
        chartDOM.innerText = insight;
        chartDOM.className = `px-3 py-1 rounded-full border-[3px] text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_var(--tw-shadow-color)] transition-colors ${insightColorClass}`;
        chartDOM.style.setProperty('--tw-shadow-color', shadowHex);
    }

    return () => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
    };
  }, []);

  return (
    <div className="w-full bg-background rounded-[2.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 p-6 lg:p-8 flex flex-col relative overflow-hidden">
      
      {/* Header section identical to other neo-brutalist headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
        <div>
           <h2 className="text-3xl font-handwriting text-primary font-bold">
             Consistency Graph
           </h2>
           <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mt-1">
             Dynamic Performance Index (EMA)
           </p>
        </div>
        
        {/* Dynamic Insight Badge injected via useEffect logic */}
        <div id="dpi-insight-badge" className="px-3 py-1 rounded-full border-2 border-primary bg-primary/10 text-primary text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/20">
           ANALYZING...
        </div>
      </div>

      {/* Canvas Container */}
      <div className="w-full h-[250px] lg:h-[300px] relative z-10">
        <canvas ref={chartRef}></canvas>
      </div>

    </div>
  );
}
