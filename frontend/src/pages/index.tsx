import Logo from '@/templates/Logo';
import { getcourses } from '@/utils/ApiHelper';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const IndexPage = () => {
  const [courses, setCourses] = useState<any[]>([]);

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

  return (
    <div className="flex ax-graadient-bg size-full flex-col text-center items-center justify-center">
      <div className="max-w-[900px] flex w-full bg-slate-950 justify-between">
        <div className="invert py-4">
          <Logo />
        </div>
        <div className="text-white justify-end h-full items-center hidden md:flex">
          <div className="mx-4">About the Research</div>
          <div className="mx-4">Contact</div>
        </div>
      </div>
      <div className="grow h-full max-w-[900px] text-white flex flex-col text-left overflow-auto">
        <div className="flex justify-between items-center flex-col md:flex-row px-4 md:px-0 animate-on-load">
          <div className="md:w-4/5 md:pr-8 ">
            <h3 className="font-black mt-8 text-2xl">
              Augmented Chatbots empowering Active Learning - Artificial
              Intelligence in Education
            </h3>

            <p className="text-sm py-4">
              This project requires us to design and develop active learning
              tools which can support students in engaging with active learning
              techniques in computing science. We are developing a system that
              helps answer course and academic related questions for students,
              in turn empowering active learning techniques. The data collected
              from this experiment will be used to process the feasibility and
              efficacy of the active learning toolkit developed and judge the
              best scenario for the use of RAG (Retrieval-Augmented Generation)
              chatbot and GAR (Generative Augmented Retrieval) chatbots in
              education.
            </p>
            <p className="text-sm pb-4">
              Feel free to select a course of your choice and converse as much
              with the application and rate the answers. We request you to share
              a review about your interaction using the feedback form provided
              on the application.
            </p>
            <p className="text-sm pb-4">
              The data that will be collected for the purpose of this research
              includes, conversation messages, messages ratings, user experience
              feedback, user consent and name. This application follows all GDPR
              regulations and policies of data and privacy protection. The data
              collected, will be discarded towards the completion of this
              research.
            </p>
          </div>
          <div className="md:w-1/5 w-48 flex flex-col justify-between">
            <p className="text-sm pb-4 text-center">A research by :</p>
            <img
              src="https://pbs.twimg.com/profile_images/1578011949425639425/4g0YXPTb_400x400.jpg"
              className="w-full"
            />
          </div>
        </div>
        <div className='animate-on-load px-4 md:px-0 mb-4'>
          <h2 className='text-xl font-bold my-8'>Available Courses</h2>
          <div className="flex overflow-auto flex-">
            {courses.map((data: any) => (
              <Link href={`/course/${data.course_id}/query/`} className='ax-main-shadow-style hover:opacity-80 mr-4 py-2 px-4 rounded-lg bg-slate-950 min-w-72 text-right animate-on-load w-72'>
                <h2 className='my-2 font-black text-base'>{data.course_id}</h2>
                <h2 className='my-2 mb-4 font-bold'>{data.course_name}</h2>
                <h2 className='max-lines-4 mb-4 text-sm'>{data.course_description}</h2>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
