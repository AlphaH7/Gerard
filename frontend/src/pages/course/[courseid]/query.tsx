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

import React from 'react';
import axios from 'axios';
import { getCurrentCourse, getcourses } from '@/utils/ApiHelper';

interface IChatElem {
  message: string;
  timestamp?: string;
  author: 'AI' | 'USER';
}

interface ICourse {
  id: number;
  course_id: string;
  course_name: string;
  course_description: string;
  course_lead: number;
}

const CourseChat = () => {
  const router = useRouter();
  const { courseid } = router.query;
  const [chatArr, setChatArr] = useState<IChatElem[]>([]);
  const [query, setQuery] = useState<string>('');
  const [showLoader, setshowLoader] = useState<boolean>(false);
  const [showError, setshowError] = useState<boolean>(false);
  const [courses, setCourses] = useState<ICourse[]>([])
  const [currentcourses, setcurrentCourses] = useState<ICourse|null>(null)
  const [ darkMode, setDarkMode ] = useState<boolean>(false);


  const getActiveCourses = async () => {
    try {
      const response = await getcourses();
      console.log('response - ', response);
      setCourses(response)
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  }

  useEffect(()=>{
    getActiveCourses()
  }, [])

  const getCurrentCourseDetails = async (z:{courseId: string}) => {
    try {
      const response = await getCurrentCourse(z);
      console.log('response - ', response);
      setcurrentCourses(response)
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  }


  useEffect(()=>{
    if(courseid) getCurrentCourseDetails({courseId: courseid.toUpperCase()})
  }, [courseid])

  const handleStream = async (payload: any) => {
    setshowLoader(true);
    try {
      const response = await axios({
        method: 'post',
        url: 'https://31c6-130-159-237-150.ngrok-free.app/chat?chat_session_id=4a8f964f-b4c6-45eb-b958-7b9b39ed6bcc',
        data: {
          course_id: 'BIORX12',
          question: payload,
        },
        responseType: 'stream', // Receive the response as text
      });

      const lines = response.data.trim().split('\n');
      lines.forEach((line: string) => {
        // console.log(line);
        const json = JSON.parse(line); // Parse each line as JSON
        const text = json.response; // Assuming 'response' field contains the text
        console.log(text);
        setChatArr((prev) => {
          const cpprev = [...prev];
          if (cpprev[cpprev.length - 1].author === 'AI') {
            cpprev[cpprev.length - 1].message =
              cpprev[cpprev.length - 1].message + text;
            return cpprev;
          } else {
            cpprev.push({
              message: text,
              author: 'AI',
              timeStamp: '',
            });
            return cpprev;
          }
        });
      });
      setshowLoader(false);
    } catch (error) {
      console.error('Error fetching stream:', error);
      setshowError(true);
    } finally {
      setshowLoader(false);
    }
  };

  const lastMessageRef = useRef();

  const scrollingTop = () => {
    const elmnt = lastMessageRef;
    if (elmnt && elmnt.current)
      elmnt.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start',
      });
  };

  useEffect(() => {
    scrollingTop();
  }, [chatArr]);

  const onEnterPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query && query.trim() !== '') {
        console.log(query);
        setChatArr((x) => [
          ...x,
          ...[
            {
              message: query,
              timeStamp: '',
              author: 'USER',
            },
          ],
        ]);
        setQuery('');
        setshowError(false);
        handleStream(query);
      }
    }
  };

  return (
    <div className={`size-full ${darkMode ? 'dark' : ''} cursor-pointer min-h-screen flex flex-col md:flex-row ax-canvas-bg text-black antialiased`}>
      <Meta
        title={`${AppConfig.title} - ${AppConfig.description}`}
        description="Login to your Account"
      />

      <nav className="min-w-72 max-w-96 w-1/3 pt-6 h-full max-h-full flex flex-col animate-on-load" onClick={()=>{setDarkMode(!darkMode)}}>
        <div className="px-6">
          <div className="bg-white dark:bg-slate-900 p-2 mb-6 rounded-lg ax-main-shadow-style w-full max-w-md ">
            <Logo />
          </div>
        </div>

        <div className="w-full h-full pb-6 flex flex-col overflow-auto px-6">
          <div className="w-full max-w-md mb-6 bg-white dark:bg-slate-900 dark:text-white rounded-lg ax-main-shadow-style">
            <h2 className="sticky top-0 bg-white dark:bg-slate-900 p-4 font-bold">
              <span className="font-bold">
                {courseid && courseid.toUpperCase()}
              </span>{' '}
              - {currentcourses?.course_name}
            </h2>
            <p className="p-4 pt-0 text-xs">
              {currentcourses?.course_description}
            </p>
            <p className="px-4 mb-4 pt-0 text-xs">
              <span className="font-bold">Course lead</span> - Prof. {currentcourses?.course_lead === 2 ? 'Alistier Noel Xver' : 'Raju Xver'}
            </p>
          </div>

          <div className="w-full max-w-md mb-6 bg-white dark:bg-slate-900 dark:text-white  rounded-lg ax-main-shadow-style pb-2">
            <h2 className="sticky top-0 bg-white dark:bg-slate-900 dark:text-white  p-4 pb-0 font-bold">
              About the last class
            </h2>
            <p className="px-4 my-2 pt-0 text-xs">
              Last class was about Active learning topics.
            </p>
            <p className="px-4 my-2 pt-0 text-xs font-semibold">
              Course Content has been updated. Feel free to ask questions about
              the same
            </p>
          </div>

          <div className="mb-6 w-full max-w-md  bg-white dark:bg-slate-900 dark:text-white  rounded-lg ax-main-shadow-style pb-2">
            <h2 className="sticky top-0 bg-white dark:bg-slate-900 dark:text-white  p-4 pb-0 font-bold">
              Courses Available{' '}
            </h2>
            {
              courses.map(
                (data : ICourse) => (
                  <p className="px-4 my-2 pt-0 text-xs">
                  <span className="font-bold" key={data.course_id}>{data.course_id}</span> - {data.course_name}
                </p>
                )
              )
            }

          </div>

          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 dark:text-white  rounded-lg ax-main-shadow-style pb-2">
            <h2 className="sticky top-0 bg-white dark:bg-slate-900 dark:text-white  p-4 pb-0 font-bold">
              Conversations{' '}
            </h2>
            {
              courses.map(
                (data : ICourse) => (
                  <p className="px-4 my-2 pt-0 text-xs">
                  <span className="font-bold" key={data.course_id}>{data.course_id}</span> - {data.course_name}
                </p>
                )
              )
            }
          </div>
        </div>
      </nav>

      <main className="content w-full text-xl flex justify-center h-full overflow-auto">
        <div className="max-w-[800px] overflow-auto h-full w-full flex flex-col justify-end py-6 pt-16 animate-from-bottom relative">
          <div className="h-full overflow-auto px-6 pb-8 flex flex-col justify-end">
            {/* <div className='absolute top-6 right-6 text-base font-bold'>Welcome, Alistier X.</div> */}

            <div className="w-full max-h-full overflow-auto">
              {chatArr.length === 0 ? (
                <div></div>
              ) : (
                chatArr.map((data: IChatElem, i: number) =>
                  data.author === 'AI' ? (
                    <div
                      {...(chatArr.length - 1 === i
                        ? { ref: lastMessageRef }
                        : {})}
                      key={data}
                      className="flex animate-from-bottom"
                    >
                      <p className="rounded-2xl max-w-[80%] text-xs my-6 text-left rounded-bl-none bg-@theme-primary dark:bg-@theme-primary200 dark:text-white text-black px-4 py-2 font-normal dark:bg-slate-900 bg-gray-100">
                        {data.message.split('\n').map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={data}
                      className="flex animate-from-bottom justify-end"
                      {...(chatArr.length - 1 === i
                        ? { ref: lastMessageRef }
                        : {})}
                    >
                      <p className="rounded-2xl max-w-[80%] bg-black text-xs mt-4 text-left rounded-br-none bg-@theme-primary dark:bg-@theme-primary200 dark:text-white text-white px-4 py-2 font-normal">
                        {data.message.split('\n').map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
          <div className="w-full flex items-center justify-between px-6">
            {showLoader && (
              <img
                src="/assets/images/loader.svg"
                className="h-6 w-16 dark:invert object-cover animate-from-bottom"
                alt="Loader"
              />
            )}
            {showError && (
              <div className="text-xs dark:text-white  font-bold w-full flex items-center animate-from-bottom">
                <MdError className="size-8 mr-2" />

                <div>
                  <div>Apologies! Something went wrong. </div>
                  <div>You may continue with the chat</div>
                </div>
              </div>
            )}
            <div className=" dark:text-white  text-right text-xs font-bold w-full">
              Welcome, Alistier X.
            </div>
          </div>
          <form
            name="query-form"
            className="max-h-[30%] px-6 relative"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setChatArr((x) => [
                ...x,
                ...[
                  {
                    message: query,
                    timeStamp: '',
                    author: 'USER',
                  },
                ],
              ]);
              setQuery('');
              setshowError(false);
              handleStream(query);
            }}
          >
            <textarea
              name="chatquery"
              value={query}
              onKeyDown={onEnterPress}
              onChange={(e: FormEvent) => {
                setQuery(e.target.value);
              }}
              className="dark:bg-slate-950 dark:text-white w-full mt-2 ax-input border-[1px] rounded-lg border-gray-100  ax-main-shadow-style"
              placeholder="Enter a course related question or query to start a discussion"
            />
            <button type="submit" className="dark:text-white absolute right-8 top-4">
              <RiSendPlaneFill title="Send Message" className="size-6" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CourseChat;
