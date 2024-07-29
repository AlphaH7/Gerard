import { AppConfig } from "@/utils/AppConfig";

const Logo = () => {
  return (
    <div className="flex   items-center p-2">
      <img src="/assets/images/gerard_logo.png"  className="size-10 mr-2 dark:invert" />
      <div className="flex flex-col relative">        
        <h1 className="text-3xl leading-8 dark:text-white font-bold p-0">{AppConfig.title}</h1>
        <p className="font-bold dark:text-white text-xxs -top-2 right-0 absolute translate-x-1/2">{AppConfig.release}</p>
        <p className="text-xxs dark:text-white font-bold">{AppConfig.description}</p>
      </div>
    </div>
  );
};

export default Logo;
