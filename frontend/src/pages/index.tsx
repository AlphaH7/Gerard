import { AppConfig } from "@/utils/AppConfig";

const IndexPage = () => {
  return (
    <div className="flex size-full flex-col text-center items-center justify-center p-2">
      <div className="flex items-center relative">
        <img src="/assets/images/gerard_logo.png" className="size-12 " />
        <h1 className="text-5xl font-bold pl-2">{AppConfig.title}</h1>
        <p className="font-bold text-xs top-0 right-0 absolute translate-x-1/2">{AppConfig.release}</p>
      </div>
      <p className="text-xs font-bold">{AppConfig.description}</p>
    </div>
  );
};

export default IndexPage;
