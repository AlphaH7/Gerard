// components/ABTestPiGraphs.tsx
/* eslint-disable no-plusplus */
// @ts-nocheck

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

type Session = {
  id: number;
  chat_session_id: string;
  message: string;
  message_sender: string;
  message_uuid: string;
  created_date: string;
  rating: number;
};

type GroupedByDate = {
  [date: string]: Session[];
};

const ABTestPiGraphs: React.FC<{ sessions: Session[]; type: string }> = ({ sessions, type }) => {
  const darkMode = true;



  // Count the ratings
  const ratingCounts = sessions.filter(data => data.message_sender === type).reduce((counts, session) => {
    counts[session.rating] = (counts[session.rating] || 0) + 1;
    return counts;
  }, {});

  const pieData = Object.entries(ratingCounts).map(([rating, count]) => ({
    name: `Rating ${rating}`,
    y: count,
  }));

  console.log('pieData -', pieData)

  const options: Highcharts.Options = {
    chart: {
      backgroundColor: darkMode ? '#020617' : '#d2d2e7',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
      type: 'pie',
    },
    title: {
      text: `Ratings Distribution for ${type}`,
      align: 'left',
      style: {
        color: darkMode ? '#fff' : '#000',
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Ratings',
        data: pieData,
        colors: ['#d0f96b', '#a6a6d0', '#f9a6a6', '#6bd0f9', '#f9d06b'],
      },
    ],
  };

  return (
    <div className="highcharts-ctr rounded-lg p-2 pb-0 bg-slate-950 text-black dark:text-white">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default ABTestPiGraphs;
