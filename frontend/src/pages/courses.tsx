// @ts-nocheck
import { RiDeleteBin2Fill } from 'react-icons/ri';
import { FaUpload } from 'react-icons/fa';
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
  getSessionsByCourse,
  getMessagesByCourse,
  getcoursetopics,
  addcoursetopic,
  adddocumententry,
  getcoursedocuments,
} from '@/utils/ApiHelper';
import { HiAcademicCap } from 'react-icons/hi2';
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
import { BsChatRightText } from 'react-icons/bs';
import { IoDocuments } from 'react-icons/io5';
import { SiProbot } from 'react-icons/si';
import { BsRobot } from 'react-icons/bs';
import { TbCategoryFilled } from 'react-icons/tb';
import { FaBalanceScale } from 'react-icons/fa';
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
  const [documents, setDocuments] = useState<any[]>([]);
  const [showTopicCrud, setshowTopicCrud] = useState<boolean>(false);
  const [tabnumber, settabnumber] = useState<number>(1);
  const [topic_name, settopic_name] = useState<string>('');
  const [document_url, setdocument_url] = useState<string>('');
  const [topic_description, settopic_description] = useState<string>('');
  const [courseTopics, setCourseTopics] = useState<Any[]>([]);
  const [selectedCourse, setselectedCourse] = useState<any>(null);
  const [sessions, setsessions] = useState<null | []>(null);
  const [uniqueUsers, setuniqueUsers] = useState<{}>(0);
  const [messages, setmessages] = useState<null | []>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      setFile(files[0]);
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

  const getCourseTopics = async () => {
    try {
      const response = await getcoursetopics();
      console.log('response - ', response);
      setCourseTopics(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const getCourseDocuments = async () => {
    try {
      const response = await getcoursedocuments();
      console.log('response - ', response);
      setDocuments(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const addCourseTopic = async (course) => {
    try {
      const response = await addcoursetopic({
        course_id: selectedCourse.course_id,
        topic_name,
        topic_description,
      });
      settopic_description('');
      settopic_name('');
      setFile(null);
      setdocument_url('');
      getCourseTopics();
      setshowTopicCrud(false);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const addCourseContent = async (course) => {
    try {
      const response = await adddocumententry({
        course_id: selectedCourse.course_id,
        user_id: 1,
        document_url,
      });
      settopic_description('');
      settopic_name('');
      setFile(null);
      setdocument_url('');
      getCourseTopics();
      setshowTopicCrud(false);
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
        setselectedCourse(response[0]);
        getsessionsByCourse(response[0].course_id);
        getmessagessByCourse(response[0].course_id);
      }
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  useEffect(() => {
    getActiveCourses();
    getCourseTopics();
    getCourseDocuments();
  }, []);

  useEffect(() => {
    if (selectedCourse !== null) {
      settabnumber(1);
      setshowTopicCrud(false);
      getsessionsByCourse(selectedCourse.course_id);
      getmessagesByCourse(selectedCourse.course_id);
      setFile(null);
    }
  }, [selectedCourse]);

  return (
    <Main
      title={`${AppConfig.title} - ${AppConfig.description}`}
      description={'Analytics'}
    >
      <div className="container mx-auto flex h-full flex-col justify-start px-4 pb-4 transition-all dark:text-white pt-8">
        <div className="flex w-full items-center justify-between">
          <div className=" flex  items-center text-xl ">
            <HiAcademicCap className="mr-2 size-6" />
            <h2 className=" font-black">Courses</h2>
          </div>
        </div>

        {/* <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <FaChalkboardTeacher className="mr-4 size-10" />
                <AnimatedNumber key={messages + sessions}>
                  <span className="text-4xl">{courses.length}</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Courses Leading</div>
            </div>
          </div>

          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <IoDocuments className="mr-4 size-10" />
                <AnimatedNumber key={messages + sessions}>
                  <span className="text-4xl">10</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Content Uploaded</div>
            </div>
          </div>

          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <BsFillChatSquareTextFill className="mr-4 size-10" />
                <AnimatedNumber key={messages + sessions}>
                  <span className="text-4xl">67</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Student Conversations</div>
            </div>
          </div>

          <div className="">
            <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
              <div className="my-2 flex w-full items-center justify-center">
                <FaUserAstronaut className="mr-4 size-10" />
                <AnimatedNumber key={messages + sessions}>
                  <span className="text-4xl">54</span>
                </AnimatedNumber>
              </div>
              <div className="text-left text-xs">Unique Participants</div>
            </div>
          </div>
        </div> */}

        <div className="w-full flex  mt-8 border-white">
          {courses.map((data) => (
            <div
              onClick={setselectedCourse.bind(null, data)}
              key={data.course_id}
              className={
                (selectedCourse.course_id === data.course_id
                  ? 'bg-slate-950 bg-opacity-70'
                  : 'border-transparent') +
                '  relative text-xs font-semibold cursor-pointer  px-4 py-2 rounded-t-md'
              }
            >{`${data.course_id} - ${data.course_name}`}</div>
          ))}
        </div>
        {selectedCourse !== null && (
          <div className="w-full bg-slate-950 bg-opacity-70 rounded-tr-lg py-4 rounded-b-lg pl-4 flex overflow-auto">
            <div className="animate-on-load w-1/2" key={selectedCourse}>
              <h2 className="text-2xl my-4 font-semibold">
                {selectedCourse.course_name}
              </h2>
              <p className="text-sm py-2">
                {selectedCourse.course_description}
              </p>

              <div className="w-full flex  mt-8 border-white border-b-[1px]">
                <div
                  onClick={() => {
                    setshowTopicCrud(false);
                    settabnumber(1);
                    setFile(null);
                  }}
                  className={
                    (tabnumber === 1 ? 'border-white' : 'border-transparent') +
                    ' border-t-[1px] border-x-[1px] relative text-xs font-semibold cursor-pointer  px-4 py-2 rounded-t-md'
                  }
                >
                  Course Topics
                </div>
                <div
                  onClick={() => {
                    setshowTopicCrud(false);
                    settabnumber(2);
                    setFile(null);
                  }}
                  className={
                    (tabnumber === 2 ? 'border-white' : 'border-transparent') +
                    ' border-t-[1px] border-x-[1px] relative text-xs font-semibold cursor-pointer  px-4 py-2 rounded-t-md'
                  }
                >
                  Course Content
                </div>
              </div>
              <div className="w-full relative">
                {!showTopicCrud && (
                  <button
                    type="button"
                    onClick={() => {
                      setshowTopicCrud(true);
                    }}
                    className="absolute right-0  bg-black text-white py-2 rounded-sm dark:bg-slate-950 ax-main-shadow-style text-xs px-4 animate-on-load"
                  >
                    Add {tabnumber === 1 ? 'Topic' : 'Content'}
                  </button>
                )}
                {tabnumber === 1 ? (
                  <>
                    {!showTopicCrud && (
                      <h2 className="text-2xl my-4 font-semibold animate-on-load">
                        Course Topics
                      </h2>
                    )}
                    <div className='overflow-auto'>
                    {!showTopicCrud &&
                      courseTopics.length !== 0 &&
                      courseTopics
                        .filter((x) => x.course_id === selectedCourse.course_id)
                        .map((data, i) => (
                          <div
                            className="w-full text-sm flex animate-on-load mb-4"
                            key={data.id}
                          >
                            <p className="font-bold w-8"># {++i}</p>
                            <div className="pl-4 grow">
                              <p className="font-semibold">{data.topic_name}</p>
                              <p>{data.topic_description}</p>
                            </div>
                            <div>
                              <button type="button">
                                <RiDeleteBin2Fill className="size-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                    {showTopicCrud && (
                      <div className="w-full pt-4  bg-opacity-30 mt-2 rounded-lg animate-on-load">
                        <h2 className="text-2xl font-semibold">
                          Add Course Topic
                        </h2>
                        <AXInput
                          type={'text'}
                          label={''}
                          placeholder={`Enter Topic Name`}
                          name="topic_name"
                          value={topic_name}
                          inputCls="mt-4"
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            settopic_name(e.target.value);
                          }}
                        />
                        <AXInput
                          type={'text'}
                          label={''}
                          placeholder={`Enter Topic Description`}
                          name="topic_description"
                          value={topic_description}
                          inputCls="mt-4 ax-input-no-height"
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            settopic_description(e.target.value);
                          }}
                          textarea
                        />
                        <div className="w-full flex">
                          <button
                            type="button"
                            onClick={addCourseTopic}
                            className="w-full bg-black text-white py-3 rounded-sm dark:bg-slate-950 ax-main-shadow-style text-xs mt-2"
                          >
                            Add Topic
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setshowTopicCrud(false);
                            }}
                            className="w-full bg-black text-white py-3 rounded-sm dark:bg-slate-950 ax-main-shadow-style text-xs mt-2 ml-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {!showTopicCrud && (
                      <h2 className="text-2xl my-4 font-semibold animate-on-load">
                        Course Content
                      </h2>
                    )}
                    {!showTopicCrud &&
                      documents.length !== 0 &&
                      documents
                        .filter((x) => x.course_id === selectedCourse.course_id)
                        .map((data, i) => (
                          <div
                            className="w-full text-sm flex animate-on-load mb-4"
                            key={data.id}
                          >
                            <p className="font-bold"># {++i}</p>
                            <div className="pl-4 grow">
                              <p className="font-semibold">
                                {data.document_url}
                              </p>
                            </div>
                          </div>
                        ))}
                    {!showTopicCrud &&
                      documents.filter(
                        (x) => x.course_id === selectedCourse.course_id,
                      ).length == 0 && (
                        <p className="w-full text-sm py-8 text-center">
                          No Files uploaded yet
                        </p>
                      )}
                    {showTopicCrud && (
                      <div className="w-full pt-4  bg-opacity-30 mt-2 rounded-lg animate-on-load">
                        <h2 className="text-2xl font-semibold">
                          Add Course Content
                        </h2>
                        <AXInput
                          type={'text'}
                          label={''}
                          placeholder={`Enter Resource Name`}
                          name="document_url"
                          value={document_url}
                          inputCls="mt-4"
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            setdocument_url(e.target.value);
                          }}
                        />
                        <div>
                          <div className="flex w-full flex-col items-center rounded-lg bg-slate-950 mt-4 p-4 ">
                            <label
                              htmlFor="file-upload"
                              className={
                                'rounded-mdflex relative flex cursor-pointer flex-col mt-4 items-center bg-slate-950 text-white font-medium text-@theme-primary hover:text-@theme-primary'
                              }
                            >
                              <FaUpload className="mr-2 size-8" />
                              <span className="my-4 text-sm">
                                {file && file.name
                                  ? file.name
                                  : 'Click here to upload a file'}
                              </span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1 text-xs text-black">
                              Select a file (Max Size - 5mb)
                            </p>
                          </div>
                        </div>
                        <div className="w-full flex pt-2">
                          <button
                            type="button"
                            onClick={addCourseTopic}
                            className="w-full bg-black text-white py-3 rounded-sm dark:bg-slate-950 ax-main-shadow-style text-xs mt-2"
                          >
                            Add Topic
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setshowTopicCrud(false);
                            }}
                            className="w-full bg-black text-white py-3 rounded-sm dark:bg-slate-950 ax-main-shadow-style text-xs mt-2 ml-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {messages !== null && (
              <div className="w-1/4 sticky top-0">
                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <LuBrainCircuit className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">2</span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">Documents Uploaded</div>
                  </div>
                </div>

                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <TbCategoryFilled className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">5</span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">Course Topics Added</div>
                  </div>
                </div>

                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <FaBalanceScale className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
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

                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <MdOutlineQuestionAnswer className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">
                          {
                            messages.filter(
                              (data) => data.message_sender !== 'USER',
                            ).length
                          }
                        </span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">Queries Answered</div>
                  </div>
                </div>
              </div>
            )}
            {messages !== null && (
              <div className="w-1/4 sticky top-0">
                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <BsFillChatSquareTextFill className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">{sessions.length}</span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">
                      Student Conversations
                    </div>
                  </div>
                </div>

                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <FaStar className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">
                          {Object.keys(uniqueUsers).length}
                        </span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">Unique Participants</div>
                  </div>
                </div>
                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <SiProbot className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">
                          {
                            messages.filter(
                              (data) => data.message_sender === 'RAG',
                            ).length
                          }
                        </span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">
                      RAG Answered Queries
                    </div>
                  </div>
                </div>

                <div className="animate-on-load w-full" key={selectedCourse}>
                  <div className="higcharts-ctr flex flex-col items-center rounded-lg  p-2 pb-4 text-black  bg-opacity-70 dark:text-white">
                    <div className="my-2 flex w-full items-center justify-center">
                      <BsRobot className="mr-4 size-10" />
                      <AnimatedNumber key={messages + sessions}>
                        <span className="text-4xl">
                          {
                            messages.filter(
                              (data) => data.message_sender === 'GAR',
                            ).length
                          }
                        </span>
                      </AnimatedNumber>
                    </div>
                    <div className="text-left text-xs">
                      GAR Answered Queries
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Main>
  );
};

export default Analytics;
