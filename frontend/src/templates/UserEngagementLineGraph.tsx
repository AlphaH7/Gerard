// components/UserEngagementLineGraph.tsx
/* eslint-disable no-plusplus */
// @ts-nocheck

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';


const getCumulativeData = (data: number[]) => {
  let cumulativeSum = 0;
  return data.map((value) => {
    cumulativeSum += value;
    return cumulativeSum + value;
  });
};

// Helper function to generate date strings
const getDateStrings = (days: number) => {
  const dateStrings = [];
  const baseDate = new Date(); // Start with the current date

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (days - i - 1));
    const options: Intl.DateTimeFormatOptions = {
      // weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    dateStrings.push(date.toLocaleDateString('en-US', options));
  }

  return dateStrings;
};

const UserEngagementLineGraph: React.FC = () => {
  const  darkMode  = true;
  const dailyData = [
    29, 71, 106, 129, 144, 176, 135, 148, 216, 194, 95, 54, 50, 81, 62, 47, 51,
    86, 77, 55, 91, 111, 98, 87, 90, 91, 110, 80, 92, 119,
  ];

  const options: Highcharts.Options = {
    chart: {
      backgroundColor: darkMode ? '#020617' : '#d2d2e7',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    title: {
      text: 'User Sessions Per Day for a Month',
      align: 'left',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    xAxis: {
      categories: getDateStrings(dailyData.length),
      lineColor: 'transparent',
      lineWidth: 2,
      labels: {
        style: {
          color: darkMode ? '#ffffff' : '#000',
        },
      },
    },
    yAxis: {
      lineColor: 'transparent',
      lineWidth: 2,
      tickColor: 'transparent',
      title: {
        text: 'Engagements',
        style: {
          color: darkMode ? '#fff' : '#000',
        },
      },
      gridLineColor: 'transparent',
      labels: {
        style: {
          color: darkMode ? '#ffffff' : '#000',
        },
      },
    },
    series: [
      {
        type: 'line',
        name: 'User Sessions',
        data: dailyData,
        color: '#d0f96b',
      },
      {
        type: 'line',
        name: 'Cumulative User sessions',
        data: getCumulativeData(dailyData),
        color: '#a6a6d0',
      },
    ],
  };

  return (
    <div className="higcharts-ctr my-4 rounded-lg bg-slate-200 text-black dark:bg-default-primary400 dark:text-white">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default UserEngagementLineGraph;
