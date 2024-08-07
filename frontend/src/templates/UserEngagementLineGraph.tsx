// components/UserEngagementLineGraph.tsx
/* eslint-disable no-plusplus */
// @ts-nocheck

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';
import { ChatSession } from '@/pages/analytics';

type GroupedByDate = {
  [date: string]: ChatSession[];
};

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

const UserEngagementLineGraph: React.FC = ({sessions}) => {
  const  darkMode  = true;

  const groupByDate : GroupedByDate = sessions.reduce((grouped: GroupedByDate, session: ChatSession) => {
    const date = session.created_date.split("T")[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(session);
    return grouped;
  }, {});

  console.log(groupByDate);

  const dailyData = Object.keys(groupByDate).map(
    data => groupByDate[data].length
  );

  const options: Highcharts.Options = {
    chart: {
      backgroundColor: darkMode ? '#020617' : '#d2d2e7',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    title: {
      text: 'User Sessions Per Day',
      align: 'left',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    xAxis: {
      categories: Object.keys(groupByDate),
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
    <div className="higcharts-ctr my-4 rounded-lg p-2 pb-0 bg-slate-950 text-black dark:text-white">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default UserEngagementLineGraph;
