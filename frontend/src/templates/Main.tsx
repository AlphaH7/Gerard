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
import { FaStar, FaUserAstronaut } from 'react-icons/fa';
import { FaMapLocation } from 'react-icons/fa6';
import { IoMdAnalytics } from 'react-icons/io';
import { LuBrainCircuit } from 'react-icons/lu';
import { RiChatVoiceFill } from 'react-icons/ri';
import { RiLogoutBoxRFill } from "react-icons/ri";

import {
  BsEmojiDizzyFill,
  BsEmojiHeartEyesFill,
  BsFillChatSquareTextFill,
} from 'react-icons/bs';
import { IoDocuments } from 'react-icons/io5';
import { FaChalkboardTeacher } from 'react-icons/fa';
import UniqueUserLineGraph from '@/templates/UniqueUserLineGraph';
import UserEngagementLineGraph from '@/templates/UserEngagementLineGraph';
import AnimatedNumber from '@/templates/widgets/AnimatedNumber';
import UserTable from '@/templates/widgets/UserTable';
import WorldMapBubbleMap from '@/templates/WorldMapBubbleMap';
import { BsChatRightText } from 'react-icons/bs';
import { HiAcademicCap } from 'react-icons/hi2';
import { VscFolderLibrary } from 'react-icons/vsc';

const Analytics = ({ children, title, description }) => {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [selectedCourse, setselectedCourse] = useState<null | string>(null);

  const getActiveCourses = async () => {
    try {
      const response = await getcourses();
      console.log('response - ', response);
      setCourses(response);
      if (response && response.length && response.length > 0)
        setselectedCourse(response[0].course_id);
    } catch (apierror: any) {
      console.log('apierrpr - ', apierror);
    }
  };

  useEffect(() => {
    getActiveCourses();
  }, []);

  return (
    <div
      className={`size-full ${
        'dark'
        // darkMode ? 'dark' : ''
      } max-h-full flex flex-col ax-graadient-bg text-black antialiased`}
    >
      <Meta {...{ title, description }} />

      <main className="content w-full text-xl flex grow max-h-full ">
        <div className=" h-full bg-slate-950 w-60 pt-4 flex flex-col text-base">
          <div className='ml-4'><Logo /></div>

          <div className="flex flex-col justify-center grow">
            <Link href="/analytics" className="text-white py-3 w-full flex pl-4">
              <IoMdAnalytics className="mr-2 size-6 mr-4" />
              Analytics
            </Link>
            <Link href="/sessions" className="text-white py-3 w-full flex pl-4">
              <BsChatRightText className="mr-2 size-6 mr-4" />
              Participant Sessions
            </Link>
            <Link href="/analytics" className="text-white py-3 w-full flex pl-4">
              <HiAcademicCap className="mr-2 size-6 mr-4" />
              Courses
            </Link>
            <Link href="/analytics" className="text-white py-3 w-full flex pl-4">
              <VscFolderLibrary className="mr-2 size-6 mr-4" />
              Course Content
            </Link>
            <div className='px-4 py-6'>
                <div className='w-full h-[1px] bg-white'/>
            </div>
            <Link href="/analytics" className="text-white py-3 w-full flex pl-4">
              <FaUserAstronaut className="mr-2 size-6 mr-4" />
              Account
            </Link>
            <Link href="/analytics" className="text-white py-3 w-full flex pl-4">
              <RiLogoutBoxRFill className="mr-2 size-6 mr-4" />
              Logout
            </Link>
          </div>
        </div>
        <div className="grow h-full flex justify-center overflow-auto">
          <div className="w-full max-w-[900px] h-full pt-8 ">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
