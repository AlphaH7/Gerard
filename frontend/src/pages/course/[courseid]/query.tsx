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
import { getCurrentCourse, getcourses, initChat } from '@/utils/ApiHelper';
import Link from 'next/link';
import AXInput from '@/templates/widgets/AXInput';

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
  const [name, setname] = useState<string>('');
  const [email, setemail] = useState<string>('');
  const [showLoader, setshowLoader] = useState<boolean>(false);
  const [showError, setshowError] = useState<boolean>(false);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [currentcourses, setcurrentCourses] = useState<ICourse | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [viewState, setViewState] = useState<'1' | '2'>('1');
  const [currentChatId, setCurrentChatId] = useState<string>('');

  const getActiveCourses = async () => {
    try {
      const response = await getcourses();
      console.log('response - ', response);
      setCourses(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  useEffect(() => {
    getActiveCourses();
  }, []);

  const getCurrentCourseDetails = async (z: { courseId: string }) => {
    try {
      const response = await getCurrentCourse(z);
      console.log('response - ', response);
      setcurrentCourses(response);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  const initChatSession = async (x?: string) => {
    try {
      const response = await initChat({
        name,
        email,
        course_id: x || courseid.toUpperCase(),
      });
      console.log('response - ', response);
      setCurrentChatId(response.id);
      setViewState('2');
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  useEffect(() => {
    if (courseid) getCurrentCourseDetails({ courseId: courseid.toUpperCase() });
  }, [courseid]);

  const handleStream = async (payload: any) => {
    setshowLoader(true);
  
    try {
      const response = await fetch(`https://saved-proper-scorpion.ngrok-free.app/chat?chat_session_id=${currentChatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseid.toUpperCase(),
          question: payload,
        }),
      });
  
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';
      let previousText = '';
  
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value, { stream: true });
  
        let lines = buffer.split('\n');
        buffer = lines.pop()!; // Save the incomplete line for the next chunk
  
        lines.forEach((line: string) => {
          if (line.trim() === '') return;
          try {
            const json = JSON.parse(line);
            const text = json.response;
  
            // Only append new content that wasn't already in the previous text
            if (!previousText.endsWith(text)) {
              previousText += text;
  
              // Remove duplicated words from the end of the previous text
              const uniqueText = previousText.split(' ').filter((word, index, arr) => {
                return word !== arr[index - 1];
              }).join(' ');
  
              setChatArr((prev) => {
                const cpprev = [...prev];
                if (cpprev[cpprev.length - 1]?.author === 'AI') {
                  cpprev[cpprev.length - 1].message = uniqueText;
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
            }
          } catch (error) {
            console.error('Error parsing line:', line, error);
          }
        });
      }
  
      // Process any remaining buffer content
      if (buffer.trim() !== '') {
        const json = JSON.parse(buffer);
        const text = json.response;
        if (!previousText.endsWith(text)) {
          previousText += text;
  
          // Remove duplicated words from the end of the previous text
          const uniqueText = previousText.split(' ').filter((word, index, arr) => {
            return word !== arr[index - 1];
          }).join(' ');
  
          setChatArr((prev) => {
            const cpprev = [...prev];
            if (cpprev[cpprev.length - 1]?.author === 'AI') {
              cpprev[cpprev.length - 1].message = uniqueText;
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
        }
      }
  
      setshowLoader(false);
    } catch (error) {
      console.error('Error fetching stream:', error);
      setshowError(true);
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
    <div
      key={courseid}
      className={`size-full ${
        darkMode ? 'dark' : ''
      } min-h-screen flex flex-row ax-canvas-bg text-black antialiased`}
    >
      <Meta
        title={`${AppConfig.title} - ${AppConfig.description}`}
        description="Login to your Account"
      />

      <nav className="pb-6 min-w-72 max-w-96 w-1/3 pt-6 h-full max-h-full flex flex-col animate-on-load">
        <div
          onClick={() => {
            setDarkMode(!darkMode);
          }}
          className="px-6 cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-900 p-2 mb-6 rounded-lg ax-main-shadow-style w-full max-w-md ">
            <Logo />
          </div>
        </div>

        <div
          className={`w-full h-full flex flex-col overflow-auto px-6 pb-6 ${
            viewState === '1' ? 'blur-sm' : ''
          }`}
        >
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
              <span className="font-bold">Course lead</span> - Prof.{' '}
              {currentcourses?.course_lead === 2
                ? 'Alistier Noel Xver'
                : 'Raju Xver'}
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

          <div className="mb-6 w-full max-w-md flex flex-col bg-white dark:bg-slate-900 dark:text-white  rounded-lg ax-main-shadow-style pb-2">
            <h2 className="sticky top-0 mb-2 bg-white dark:bg-slate-900 dark:text-white  p-4 pb-0 font-bold">
              Courses Available{' '}
            </h2>
            {courses.map((data: ICourse) => (
              <Link
                onClick={() => {
                  setChatArr([]);
                  setshowError(false);
                  setshowLoader(false);
                  setQuery('');
                  initChatSession(data.course_id);
                }}
                href={`/course/${data.course_id}/query`}
                className="px-4 mb-2 w-full text-xs"
              >
                <span className="font-bold" key={data.course_id}>
                  {data.course_id}
                </span>{' '}
                - {data.course_name}
              </Link>
            ))}
          </div>

          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 dark:text-white  rounded-lg ax-main-shadow-style pb-2">
            <h2 className="sticky top-0 bg-white dark:bg-slate-900 dark:text-white  p-4 pb-0 font-bold">
              Conversations{' '}
            </h2>

            <p className='px-4 text-xs pt-2 text-gray-600'>You will find your past conversations listed here</p>
            {/* {courses.map((data: ICourse) => (
              <p className="px-4 my-2 pt-0 text-xs">
                <span className="font-bold" key={data.course_id}>
                  {data.course_id}
                </span>{' '}
                - {data.course_name}
              </p>
            ))} */}
          </div>
        </div>
      </nav>

      <main className="content w-full text-xl flex justify-center h-full overflow-auto">
        {viewState === '1' ? (
          <div className="w-full h-full flex flex-col animate-from-bottom items-center justify-center">
            <form
              name="signup-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                initChatSession();
              }}
              className="flex flex-col max-w-[500px] px-2 w-full bg-white dark:bg-slate-800 dark:text-white"
            >
              <p className="text-2xl pb-1">Hi there!</p>
              <p className="pb-4 text-base">Let's get to know each other!</p>
              <div>
                <AXInput
                  type={'text'}
                  label={''}
                  placeholder={`Please enter your name`}
                  name="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setname(e.target.value);
                  }}
                />
              </div>
              <div className="mt-4">
                <AXInput
                  type={'text'}
                  label={''}
                  placeholder={`Please enter your Email`}
                  name="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setemail(e.target.value);
                  }}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white dark:bg-slate-600 ax-main-shadow-style text-xs rounded-sm mt-4 py-2 "
              >
                Lets Go!
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-[900px] overflow-auto h-full w-full flex flex-col justify-end py-6 pt-16 animate-from-bottom relative">
            <div className="h-full overflow-auto px-6 pb-6 flex flex-col justify-end">
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
                            <React.Fragment key={index + data.message}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {line}
                              </ReactMarkdown>
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
                            <React.Fragment key={index + data.message}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {line}
                              </ReactMarkdown>{' '}
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
                Welcome, {name}
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
                className="dark:bg-slate-950 border-0 dark:text-white w-full mt-2 ax-input border-[1px] rounded-lg border-gray-100  ax-main-shadow-style"
                placeholder="Enter a course related question or query to start a discussion"
              />
              <button
                type="submit"
                className="dark:text-white absolute right-8 top-4"
              >
                <RiSendPlaneFill title="Send Message" className="size-6" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseChat;
