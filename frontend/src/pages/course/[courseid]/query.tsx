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
import { getCurrentCourse, getcourses, initChat, addrating } from '@/utils/ApiHelper';
import Link from 'next/link';
import AXInput from '@/templates/widgets/AXInput';
import { generateUUID } from '@/utils/AppHelper';
import { FaStar } from 'react-icons/fa6';

interface IChatElem {
  message: string;
  timestamp?: string;
  author: 'AI' | 'USER';
  message_uuid: string;
  rating?: number;
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
  const [hoveredStar, setHoveredStar] = useState(null);
  const [hoveredStarid, setHoveredStarid] = useState(null);

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

  const handleStream = async (payload: any, messageUUID: string) => {
    setshowLoader(true);
    console.log('payload - ', payload);
    // if(payload.trim() === '')return;
    try {
      const response = await fetch(
        `http://local.dev.server:6789/backend/apis/chat?chat_session_id=${currentChatId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            course_id: courseid.toUpperCase(),
            question: payload,
            message_uuid: messageUUID,
          }),
        },
      );

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
          // if (line.trim() === '') return;
          try {
            const json = JSON.parse(line);
            const text = json.response;

            // Only append new content that wasn't already in the previous text
            if (!previousText.endsWith(text)) {
              previousText += text;

              // Remove duplicated words from the end of the previous text
              const uniqueText = previousText
                .split(' ')
                .filter((word, index, arr) => {
                  return word !== arr[index - 1];
                })
                .join(' ');

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
                    message_uuid: messageUUID,
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
          const uniqueText = previousText
            .split(' ')
            .filter((word, index, arr) => {
              return word !== arr[index - 1];
            })
            .join(' ');

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
        const messageUUID = generateUUID();
        console.log('messageUUID - ', messageUUID);
        setChatArr((x) => [
          ...x,
          ...[
            {
              message: query,
              timeStamp: '',
              author: 'USER',
              message_uuid: messageUUID,
            },
          ],
        ]);
        setQuery('');
        setshowError(false);
        handleStream(query, messageUUID);
      }
    }
  };

  const setSelectedStar = async (rating: number, message_uuid: string) => {
    try {
      const response = await addrating({
        message_uuid, rating
      });
      console.log('response - ', response);
      const chatArrCp = chatArr
      chatArrCp.forEach(
        data => {
          if(data.message_uuid === message_uuid) {
            data.rating = rating
          }
        }
      )
      setChatArr(chatArrCp)
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  }

  return (
    <div
      key={courseid}
      className={`size-full ${
        'dark'
        // darkMode ? 'dark' : ''
      } min-h-screen flex flex-col ax-graadient-bg text-black antialiased`}
    >
      <Meta
        title={`${AppConfig.title} - ${AppConfig.description}`}
        description={
          currentcourses !== null
            ? `${currentcourses?.course_id} - ${currentcourses?.course_name}`
            : ''
        }
      />

      <nav className=" bg-default-primary50 px-4 dark:bg-slate-950   w-full  flex items-center justify-between animate-from-top">
        <div className="max-w-[900px] mx-auto w-full flex items-center justify-between">
          <div className="h-full rounded-lg ax-main-shadow-style">
            <Logo />
          </div>

          <div className="w-full text-right grow rounded-lg dark:text-white  ax-main-shadow-style">
            <h2 className="rounded-lg pt-3 px-4 font-bold">
              <span className="font-bold">
                {courseid && courseid.toUpperCase()}
              </span>{' '}
              - {currentcourses?.course_name}
            </h2>
            {/* <p className=" pt-0 text-xs">
              {currentcourses?.course_description}
            </p> */}
            <p className="px-4 mb-4 pt-2 text-xs">
              <span className="font-bold">Course lead</span> - Prof. AX
            </p>
          </div>
        </div>
      </nav>

      <main className="content w-full text-xl flex justify-center grow overflow-auto">
        {viewState === '1' ? (
          <div className="w-full h-full flex flex-col animate-from-bottom items-center justify-center">
            <form
              name="signup-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                initChatSession();
              }}
              className="flex flex-col max-w-[500px] px-2 w-full  dark:text-white"
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
                className="w-full bg-black text-white py-3 rounded-sm dark:bg-slate-950 ax-main-shadow-style text-xs mt-4"
              >
                Lets Go!
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-[900px] overflow-auto h-full w-full flex flex-col justify-end pb-2 animate-from-bottom relative">
            <div className="h-full overflow-auto px-6 pb-6 flex flex-col justify-end">
              {/* <div className='absolute top-6 right-6 text-base font-bold'>Welcome, Alistier X.</div> */}

              <div className="w-full max-h-full overflow-auto">
                {chatArr.length === 0 ? (
                  <div></div>
                ) : (
                  chatArr.map((data: IChatElem, i: number) =>
                    data.author !== 'USER' ? (
                      <div
                        key={data}
                        className="flex flex-col animate-from-bottom"
                      >
                        <p className="rounded-2xl max-w-[80%] text-xs mt-6 text-left rounded-bl-none bg-@theme-primary dark:bg-@theme-primary200 dark:text-white text-black px-4 py-2 font-normal dark:bg-default-primary500 bg-gray-100">
                          {data.message.split('\n').map((line, index) => (
                            <React.Fragment key={index + data.message}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {line}
                              </ReactMarkdown>
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                        <div
                          {...(chatArr.length - 1 === i
                            ? { ref: lastMessageRef }
                            : {})}
                          className="flex justify-end max-w-[80%] mb-6 mt-2"
                        >
                          {[0, 1, 2, 3, 4].map((starIndex) => (
                            <button
                              type="button"
                              onMouseEnter={() => {
                                setHoveredStar(starIndex);
                                setHoveredStarid(data.message_uuid)
                              }}
                              onMouseLeave={() => {
                                setHoveredStar(null)
                                setHoveredStarid(null)
                              }}
                              onClick={() => setSelectedStar(starIndex + 1, data.message_uuid)}
                            >
                              <FaStar className={"size-5 mx-1 " +(data.rating ? starIndex < data.rating ? 'text-yellow-500' : ''  : (hoveredStar !== null && starIndex <= hoveredStar && hoveredStarid === data.message_uuid)  ? 'text-yellow-500 opacity-70' : 'grey') }/>
                            </button>
                          ))}
                        </div>
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
                const messageUUID = generateUUID();
                console.log('messageUUID - ', messageUUID);
                setChatArr((x) => [
                  ...x,
                  ...[
                    {
                      message: query,
                      timeStamp: '',
                      author: 'USER',
                      message_uuid: messageUUID,
                    },
                  ],
                ]);
                setQuery('');
                setshowError(false);
                handleStream(query, messageUUID);
              }}
            >
              <textarea
                name="chatquery"
                value={query}
                onKeyDown={onEnterPress}
                onChange={(e: FormEvent) => {
                  setQuery(e.target.value);
                }}
                className="dark:bg-default-primary450 dark:bg-slate-950 focus:border-0 dark:text-white w-full mt-2 ax-input  rounded-lg ax-main-shadow-style"
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
