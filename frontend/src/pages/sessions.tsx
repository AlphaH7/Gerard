// @ts-nocheck
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AppConfig } from '@/utils/AppConfig';
import { useRouter } from 'next/router';
import { Within } from '@theme-toggles/react';
import { Meta } from '@/layouts/Meta';
import Logo from '@/templates/Logo';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { RiSendPlaneFill } from 'react-icons/ri';
import { timeStamp } from 'console';
import { MdError } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React from 'react';
import axios from 'axios';
import {
  getCurrentCourse,
  getcourses,
  getMessagesByCourse,
} from '@/utils/ApiHelper';
import Link from 'next/link';
import AXInput from '@/templates/widgets/AXInput';
import { FaStar, FaUserAstronaut } from 'react-icons/fa';
import { FaMapLocation } from 'react-icons/fa6';
import { IoMdAnalytics } from 'react-icons/io';
import { LuBrainCircuit } from 'react-icons/lu';
import { RiChatVoiceFill } from 'react-icons/ri';
import {
  BsEmojiDizzyFill,
  BsEmojiHeartEyesFill,
  BsFillChatSquareTextFill,
} from 'react-icons/bs';
import { BsChatRightText } from 'react-icons/bs';
import { IoDocuments } from 'react-icons/io5';
import { FaChalkboardTeacher } from 'react-icons/fa';
import UniqueUserLineGraph from '@/templates/UniqueUserLineGraph';
import UserEngagementLineGraph from '@/templates/UserEngagementLineGraph';
import AnimatedNumber from '@/templates/widgets/AnimatedNumber';
import Main from '@/templates/Main';
import UserTable from '@/templates/widgets/UserTable';
import WorldMapBubbleMap from '@/templates/WorldMapBubbleMap';
import { AgGridReact } from 'ag-grid-react';

const Analytics = () => {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [selectedCourse, setselectedCourse] = useState<null | string>(null);
  const [sessions, setsessions] = useState<null | []>(null);
  const [uniqueUsers, setuniqueUsers] = useState<{}>(0);

  const getsessionsByCourse = async (course) => {
    try {
      const response = await getMessagesByCourse({ course });
      console.log('response - ', response);
      setsessions(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const getActiveCourses = async () => {
    try {
      const response = await getcourses();
      console.log('response - ', response);
      setCourses(response);
      if (response && response.length && response.length > 0) {
        setselectedCourse(response[0].course_id);
        getsessionsByCourse(response[0].course_id);
      }
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  useEffect(() => {
    getActiveCourses();
  }, []);

  useEffect(() => {
    getsessionsByCourse(selectedCourse);
  }, [selectedCourse]);


  return (
    <Main
      title={`${AppConfig.title} - ${AppConfig.description}`}
      description={'Analytics'}
    >
      <div className="container mx-auto flex h-full flex-col justify-start px-4 pb-4 transition-all dark:text-white pt-8">
        <div className="flex w-full items-center justify-between">
          <div className=" flex  items-center text-xl ">
            <BsChatRightText className="mr-2 size-6" />
            <h2 className=" font-black">Participant Messages</h2>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <FaChalkboardTeacher className="mr-4 size-10" />
                <AnimatedNumber>
                  <span className="text-4xl">{courses.length}</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Courses Leading</div>
            </div>
          </div>

          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <IoDocuments className="mr-4 size-10" />
                <AnimatedNumber>
                  <span className="text-4xl">10</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Content Uploaded</div>
            </div>
          </div>

          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <BsFillChatSquareTextFill className="mr-4 size-10" />
                <AnimatedNumber>
                  <span className="text-4xl">67</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Student Conversations</div>
            </div>
          </div>

          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <FaUserAstronaut className="mr-4 size-10" />
                <AnimatedNumber>
                  <span className="text-4xl">54</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Unique Participants</div>
            </div>
          </div>
        </div>

        <div className="w-full flex  mt-12 border-white">
          {courses.map((data) => (
            <div
              onClick={setselectedCourse.bind(null, data.course_id)}
              className={
                (selectedCourse === data.course_id
                  ? 'bg-slate-950'
                  : 'border-transparent') +
                '  relative text-xs font-semibold cursor-pointer  px-2 py-2 rounded-t-md'
              }
            >{`${data.course_id} - ${data.course_name}`}</div>
          ))}
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
                headerName: 'Author',
                field: 'message_sender',
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
                flex: 1
              },
            ]}
            rowData={sessions}
            domLayout="autoHeight"
            pagination
            // defaultColDef={{
            //   flex: 1,
            //   resizable: true,
            // }}
            paginationPageSize={10}
            rowSelection="multiple"
            onGridReady={() => {}}
            sideBar="filters"      
            className=""
          />
        </div>
      </div>
    </Main>
  );
};

export default Analytics;
