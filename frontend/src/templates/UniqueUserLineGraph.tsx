// components/UserEngagementBarGraph.tsx
/* eslint-disable no-plusplus */
// @ts-nocheck

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { cloneElement, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

type ChatSession = {
  created_date: string;
  message: string;
  // Add other properties if needed
};

// Dummy data for topics and their query counts
// const topics = [
//   'Introduction',
//   'Data Types',
//   'Control Flow',
//   'Functions',
//   'Modules',
//   'File Handling',
//   'Error Handling',
//   'OOP',
//   'Regular Expressions',
//   'Decorators',
//   'Generators',
//   'Async Programming',
//   'Web Development',
//   'Data Analysis',
// ];

let classifications = {
  'Conceptual Understanding': {
    keywords: [
      'Conceptual Understanding',
      'Definition and Explanation',
      'Theoretical Questions',
    ],
  },
  'Practical Implementation': {
    keywords: [
      'Practical Implementation',
      'How-to Guides',
      'Examples and Use Cases',
    ],
  },
  Analytical: {
    keywords: [
      'Analytical',
      'Comparison and Contrast',
      'Advantages and Disadvantages',
    ],
  },
  'Problem-Solving': {
    keywords: ['Problem-Solving', 'Debugging Help', 'Optimization'],
  },
  Application: { keywords: ['Application', 'Project Ideas, Integration'] },
  'Contextual Understanding': {
    keywords: [
      'Contextual Understanding',
      'Historical Context',
      'Ethical and Societal Impact',
    ],
  },
  'Evaluation and Critique': {
    keywords: [
      'Evaluation and Critique',
      'Critical Analysis',
      'Reviews and Feedback',
    ],
  },
  'Resource Requests': {
    keywords: [
      'Resource Requests',
      'Reference Materials',
      'Tool Recommendations',
    ],
  },
  Other: {
    keywords: ['Other', "Anything that doesn't fit into the other categories"],
  },
};

// Randomly generate query counts for each classification within each topic
const generateRandomData = (topics) => {
  const data = [];
  for (let i = 0; i < topics.length; i++) {
    const topicData = [];
    for (let j = 0; j < Object.keys(classifications).length; j++) {
      topicData.push(Math.floor(Math.random() * 10) + 1);
    }
    data.push(topicData);
  }
  return data;
};

const UserEngagementBarGraph: React.FC = ({
  messages,
  topics,
  selectedCourse,
}: any) => {
  const [allMessages, setallMessages] = useState([]);
  const [seriesData, setseriesData] = useState([]);
  const [selectedtags, setselectedtags] = useState([]);

  useEffect(() => {
    let counts = { ...classifications };
    const selectedTopics = topics.filter(
      (data) => data.course_id === selectedCourse,
    );
    Object.keys(classifications).map((data) => {
      counts[data].freq = selectedTopics.map((x) => 0);
    });

    const updatedMsgs = [
      ...messages.filter((data) => data.message_sender === 'USER'),
    ];

    selectedTopics.forEach((c, index) => {
      updatedMsgs.forEach((data) => {
        data.tags = [];
        if (
          data.message_sender === 'USER' &&
          ((data.message &&
            data.message.toLowerCase().includes(c.topic_name.toLowerCase())) ||
            (data.topic_classification &&
              data.topic_classification
                .toLowerCase()
                .includes(c.topic_name.toLowerCase())))
        ) {
          data.tags.push(c.topic_name.toLowerCase());
          Object.keys(classifications).map((classEx) => {
            let includes = false;
            classifications[classEx].keywords.forEach((b) => {
              if (
                (data.message &&
                  data.message.toLowerCase().includes(b.toLowerCase())) ||
                (data.topic_classification &&
                  data.topic_classification
                    .toLowerCase()
                    .includes(b.toLowerCase()))
              ) {
                includes = true;
              }
            });
            if (includes) {
              counts[classEx].freq[index] = ++counts[classEx].freq[index];
              data.tags.push(classEx.toLowerCase());
            }
          });
        }
      });
    });

    console.log('updatedMsgs - ', updatedMsgs);

    setallMessages(updatedMsgs);

    setseriesData(
      Object.keys(classifications).map((classification, index) => ({
        name: classification,
        data: classifications[classification].freq,
      })),
    );

    console.log('seriesData - ', seriesData);
  }, []);

  const darkMode = true;

  console.log('seriesData - ', seriesData);

  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
      height: 1000,
      backgroundColor: '#020617' ,
      style: {
        color: '#fff',
      },
    },
    title: {
      text: 'Topic-wise Queries Index',
      align: 'left',
      style: {
        color: '#fff',
      },
    },
    xAxis: {
      categories: topics
        .filter((x) => x.course_id === selectedCourse)
        .map((data) => data.topic_name),
      title: {
        text: null,
      },
      labels: {
        style: {
          color: '#ffffff',
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Number of Queries',
        align: 'high',
        style: {
          color: '#fff',
        },
      },
      labels: {
        overflow: 'justify',
        style: {
          color: '#ffffff',
        },
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          style: {
            color: '#ffffff',
          },
        },
        stacking: 'normal',
      },
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: '#ffffff',
      },
      itemHoverStyle: {
        color: '#9f9f9f',
      },
    },
    credits: {
      enabled: false,
    },
    series: seriesData,
  };

  return (
    <div className="highcharts-ctr my-4 rounded-lg p-2 pb-0 bg-slate-950 text-black dark:text-white">
      <HighchartsReact highcharts={Highcharts} options={options} />
      <div className="pt-4 mt-2 border-t-[1px]">
        <div className="w-full">
          <h2 className="text-base pl-4 font-bold">
            Topic and Type wise prompts
          </h2>
          <p className='pl-4 text-xs mt-2'>Select tags below to filter messages</p>
          <p className='pl-4 mt-4 flex items-center text-xs font-bold'>Topic Tags : </p>
          <div className="flex flex-wrap pt-4 pb-2 pl-2">
            {topics.map((data) => data.course_id === selectedCourse ? (
              <button
                type="button"
                key={data.topic_name + data.id}
                className={
                  'text-sm px-4 py-2  m-1 rounded-md ' +
                  (selectedtags.includes(data.topic_name)
                    ? ' bg-white text-slate-950 '
                    : 'bg-slate-800')
                }
                onClick={setselectedtags.bind(null, (x) =>
                  x.includes(data.topic_name)
                    ? x.filter((m) => data.topic_name !== m)
                    : [...x, ...[data.topic_name]],
                )}
              >
                {data.topic_name}
              </button>
            ) : null)}

          </div>
          <p className='pl-4 mt-4 flex items-center text-xs font-bold'>Prompt Type Tags : </p>

          <div className="flex flex-wrap pt-4 pb-2 pl-2">

            {seriesData.map((data) => (
              <button
                type="button"
                key={data}
                className={
                  'text-sm px-4 py-2 m-1 rounded-md ' +
                  (selectedtags.includes(data.name)
                    ? ' bg-white text-slate-950 '
                    : 'bg-slate-800')
                }
                onClick={setselectedtags.bind(null, (x) =>
                  x.includes(data.name)
                    ? x.filter((m) => data.name !== m)
                    : [...x, ...[data.name]],
                )}
              >
                {data.name}
              </button>
            ))}
          </div>
        </div>
        <div className="ag-theme-alpine-dark">
          <AgGridReact
            columnDefs={[
              {
                headerName: 'Chat Session ID',
                field: 'chat_session_id',
                checkboxSelection: false,
                sortable: true,
                filter: true,
                floatingFilter: true,
              },
              {
                headerName: 'Created Timestamp',
                field: 'created_date',
                checkboxSelection: false,
                sortable: true,
                filter: true,
                floatingFilter: true,
              },
              {
                headerName: 'Message',
                field: 'message',
                checkboxSelection: false,
                sortable: true,
                filter: true,
                floatingFilter: true,
                flex: 1,
              },
              // {
              //   headerName: 'Message',
              //   field: 'tags',
              //   checkboxSelection: false,
              //   sortable: true,
              //   filter: true,
              //   floatingFilter: true,
              //   flex: 1,
              // },
            ]}
            rowData={allMessages.filter((data) =>
              selectedtags.length === 0
                ? allMessages
                : selectedtags.filter(
                    (z) =>
                      (data.message &&
                        data.message.toLowerCase().includes(z.toLowerCase())) ||
                      (data.topic_classification &&
                        data.topic_classification
                          .toLowerCase()
                          .includes(z.toLowerCase())),
                  ).length > 0,
            )}
            defaultColDef={{
                              resizable: true

            }}
            domLayout="autoHeight"
            pagination
            paginationPageSize={10}
            rowSelection="multiple"
            onGridReady={() => {}}
            sideBar="filters"
            className=""
          />
        </div>
      </div>
    </div>
  );
};

export default UserEngagementBarGraph;
