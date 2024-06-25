import { AppConfig } from "@/utils/AppConfig";

const Logo = () => {
  return (
    <div className="flex size-full flex-col text-center items-center justify-center p-2">
      <div className="flex items-center relative">
        <img src="/assets/images/gerard_logo.png" className="size-10 " />
        <h1 className="text-4xl font-bold pl-2">{AppConfig.title}</h1>
        <p className="font-bold text-xxs top-0 right-0 absolute translate-x-1/2">{AppConfig.release}</p>
      </div>
      <p className="text-xxs font-bold">{AppConfig.description}</p>
    </div>
  );
};

export default Logo;
