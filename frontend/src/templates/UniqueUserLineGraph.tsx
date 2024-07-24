// components/UserEngagementBarGraph.tsx
/* eslint-disable no-plusplus */
// @ts-nocheck

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

type ChatSession = {
  created_date: string;
  message: string;
  // Add other properties if needed
};

// Dummy data for topics and their query counts
const topics = [
  'Introduction',
  'Data Types',
  'Control Flow',
  'Functions',
  'Modules',
  'File Handling',
  'Error Handling',
  'OOP',
  'Regular Expressions',
  'Decorators',
  'Generators',
  'Async Programming',
  'Web Development',
  'Data Analysis',
];

const queryCounts = [
  10, 5, 5, 2, 4, 12, 6, 18, 3, 4, 9, 7, 11, 14,
];

const UserEngagementBarGraph: React.FC = () => {
  const darkMode = true;

  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
      backgroundColor: darkMode ? '#020617' : '#d2d2e7',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    title: {
      text: 'Topic-wise Queries Index',
      align: 'left',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    xAxis: {
      categories: topics,
      title: {
        text: null,
      },
      labels: {
        style: {
          color: darkMode ? '#ffffff' : '#000',
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Number of Queries',
        align: 'high',
        style: {
          color: darkMode ? '#fff' : '#000',
        },
      },
      labels: {
        overflow: 'justify',
        style: {
          color: darkMode ? '#ffffff' : '#000',
        },
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          style: {
            color: darkMode ? '#ffffff' : '#000',
          },
        },
      },
    },
    legend: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        type: 'bar',
        data: queryCounts,
        color: '#d0f96b',
      },
    ],
  };

  return (
    <div className="highcharts-ctr my-4 rounded-lg p-2 pb-0 bg-slate-950 text-black dark:text-white">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default UserEngagementBarGraph;
