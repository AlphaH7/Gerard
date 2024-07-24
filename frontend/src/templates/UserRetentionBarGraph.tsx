// components/UserRetentionBarGraph.tsx
/* eslint-disable no-plusplus */
// @ts-nocheck

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

type ChatSession = {
  created_date: string;
  email: string;
  name: string;
  course_id: string;
  chat_heading: string | null;
};

const getSessionCounts = (sessions: ChatSession[]) => {
  const sessionCounts = sessions.reduce((counts, session) => {
    counts[session.email] = (counts[session.email] || 0) + 1;
    return counts;
  }, {});

  return sessionCounts;
};

const getCountsOfCounts = (sessionCounts) => {
  const countsOfCounts = {};
  Object.values(sessionCounts).forEach(count => {
    countsOfCounts[count] = (countsOfCounts[count] || 0) + 1;
  });

  return countsOfCounts;
};

const UserRetentionBarGraph: React.FC = ({sessions}) => {
  const darkMode = true;
  const sessionCounts = getSessionCounts(sessions);
  const countsOfCounts = getCountsOfCounts(sessionCounts);

  const sessionCountKeys = Object.keys(countsOfCounts);
  const countValues = Object.values(countsOfCounts);

  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
      backgroundColor: darkMode ? '#020617' : '#d2d2e7',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    title: {
      text: 'Student Retention Graph',
      align: 'left',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    xAxis: {
      categories: sessionCountKeys,
      title: {
        text: 'Number of Sessions',
        style: {
          color: darkMode ? '#fff' : '#000',
        },
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
        text: 'Count of Users',
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
        data: countValues,
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

export default UserRetentionBarGraph;
