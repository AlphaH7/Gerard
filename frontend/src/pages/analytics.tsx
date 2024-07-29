// @ts-nocheck
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
  initChat,
  getSessionsByCourse,
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
import { MdOutlineQuestionAnswer } from 'react-icons/md';
import { IoDocuments } from 'react-icons/io5';
import { FaChalkboardTeacher } from 'react-icons/fa';
import UniqueUserLineGraph from '@/templates/UniqueUserLineGraph';
import UserEngagementLineGraph from '@/templates/UserEngagementLineGraph';
import ABTestSessionsGraphs from '@/templates/ABTestSessionsGraphs';
import UserRetentionBarGraph from '@/templates/UserRetentionBarGraph';
import ABTestPiGraphs from '@/templates/ABTestPiGraphs';
import AnimatedNumber from '@/templates/widgets/AnimatedNumber';
import Main from '@/templates/Main';
import UserTable from '@/templates/widgets/UserTable';
import WorldMapBubbleMap from '@/templates/WorldMapBubbleMap';
import { SiProbot } from 'react-icons/si';
import { BsRobot } from 'react-icons/bs';
import { TbCategoryFilled } from 'react-icons/tb';
import { FaBalanceScale } from 'react-icons/fa';

export type ChatSession = {
  id: string;
  created_date: string;
  email: string;
  name: string;
  course_id: string;
  chat_heading: string | null;
};

const Analytics = () => {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [selectedCourse, setselectedCourse] = useState<null | string>(null);
  const [messages, setmessages] = useState<null | []>(null);
  const [sessions, setsessions] = useState<null | []>(null);
  const [uniqueUsers, setuniqueUsers] = useState<{}>(0);

  const getActiveCourses = async () => {
    try {
      const response = await getcourses();
      console.log('response - ', response);
      setCourses(response);
      if (response && response.length && response.length > 0) {
        setselectedCourse(response[0].course_id);
        getmessagesByCourse(response[0].course_id);
        getsessionsByCourse(response[0].course_id);
      }
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const getmessagesByCourse = async (course) => {
    try {
      const response = await getMessagesByCourse({ course });
      console.log('response - ', response);
      setmessages(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const getsessionsByCourse = async (course) => {
    try {
      const response = await getSessionsByCourse({ course });
      console.log('response - ', response);
      setsessions(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  useEffect(() => {
    getActiveCourses();
  }, []);

  useEffect(() => {
    setmessages(null);
    setsessions(null);
    setuniqueUsers({});
    getmessagesByCourse(selectedCourse);
    getsessionsByCourse(selectedCourse);
  }, [selectedCourse]);

  useEffect(() => {
    if (sessions != null && sessions.length > 0) {
      let intmap = {};
      console.log('sessions - ', sessions);
      sessions.forEach((data) => {
        if (intmap[data.email]) {
          intmap[data.email].ids.push(data.id);
          intmap[data.email].count++;
        } else {
          intmap[data.email] = {
            count: 1,
            ids: [data.id],
          };
        }
      });
      console.log('intmap - ', intmap);
      setuniqueUsers(intmap);
    }
  }, [sessions]);

  return (
    <Main
      title={`${AppConfig.title} - ${AppConfig.description}`}
      description={'Analytics'}
    >
      <div className="container mx-auto flex h-full flex-col justify-start px-4 py-4 pt-8 transition-all dark:text-white">
        <div className="flex w-full items-center justify-between">
          <div className=" flex  items-center text-xl ">
            <IoMdAnalytics className="mr-2 size-6" />
            <h2 className=" font-black">Academic Statistics</h2>
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

        <div className="flex items-center text-xl my-8 pt-4">
          <IoMdAnalytics className="mr-2 size-6" />
          <h2 className=" font-black">Course Statistics</h2>
        </div>

        <div className="w-full flex border-b-2 border-slate-950">
          {courses.map((data) => (
            <div
              onClick={setselectedCourse.bind(null, data.course_id)}
              className={
                (selectedCourse === data.course_id
                  ? 'bg-slate-950 '
                  : 'border-transparent') +
                ' relative text-xs py-2 font-semibold cursor-pointer  px-2  rounded-t-md'
              }
            >{`${data.course_id} - ${data.course_name}`}</div>
          ))}
        </div>

        {sessions !== null && messages !== null && courses !== null && (
          <div className="w-full animate-on-load" key={selectedCourse}>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <BsFillChatSquareTextFill className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">{sessions.length}</span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">Student Conversations</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <FaStar className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">
                        {Object.keys(uniqueUsers).length}
                      </span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">Unique Participants</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <SiProbot className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">
                        {
                          messages.filter(
                            (data) => data.message_sender === 'RAG',
                          ).length
                        }
                      </span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">RAG Answered Queries</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <BsRobot className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">
                        {
                          messages.filter(
                            (data) => data.message_sender === 'GAR',
                          ).length
                        }
                      </span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">GAR Answered Queries</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <MdOutlineQuestionAnswer className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">
                        {
                          messages.filter(
                            (data) => data.message_sender === 'USER',
                          ).length
                        }
                      </span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">Queries Answered</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <LuBrainCircuit className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">2</span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">Documents Uploaded</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <TbCategoryFilled className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">5</span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">Course Topics Added</div>
                </div>
              </div>

              <div className="">
                <div className="higcharts-ctr flex flex-col items-center rounded-lg bg-default-primary100 p-2 pb-4 text-black dark:bg-slate-950 dark:text-white">
                  <div className="my-2 flex w-full items-center justify-center">
                    <FaBalanceScale className="mr-4 size-10" />
                    <AnimatedNumber>
                      <span className="text-4xl">
                        {messages.reduce(
                          (acc, { rating, message_sender }) =>
                            rating !== null && message_sender === 'USER'
                              ? {
                                  sum: acc.sum + rating,
                                  count: acc.count + 1,
                                }
                              : acc,
                          { sum: 0, count: 0 },
                        ).sum /
                          messages.filter(
                            (data) => data.message_sender === 'USER',
                          ).length}
                      </span>
                    </AnimatedNumber>
                  </div>
                  <div className="text-left text-xs">Average Rating</div>
                </div>
              </div>
            </div>

            <UniqueUserLineGraph />

            <div className=" grid grid-cols-1 gap-4 md:grid-cols-2">
              <ABTestPiGraphs {...{ sessions: messages, type: 'RAG' }} />
              <ABTestPiGraphs {...{ sessions: messages, type: 'GAR' }} />
            </div>

            <ABTestSessionsGraphs {...{ sessions: messages }} />

            <UserRetentionBarGraph {...{ sessions }} />
            
            <UserEngagementLineGraph {...{ sessions }} />


            {/* <div className="mt-6 flex max-h-full flex-col overflow-auto rounded-lg bg-default-primary100 bg-opacity-30  dark:bg-default-primary400">
              {documents.map((data: any) => (
                <div
                  key={data.id}
                  className="list-elem-ctr flex w-full cursor-pointer items-center justify-between  p-4 font-normal hover:bg-white hover:dark:bg-default-primary300"
                >
                  <div className="font-semibold">{data.name}</div>
                  <div className="list-elem-right">{`Updated ${timeAgo(
                    data.date
                  )}`}</div>
                  <div className="list-elem-right-actions flex h-5 items-center transition-all">
                    <button type="button">
                      <RiEdit2Fill className="mr-4 size-5" />
                    </button>
                    <button type="button">
                      <RiDeleteBin2Fill className="size-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div> */}
          </div>
        )}
      </div>
    </Main>
  );
};

export default Analytics;
