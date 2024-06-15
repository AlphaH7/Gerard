import '../styles/global.css';

// eslint-disable-next-line import/no-extraneous-dependencies
import type { AppProps } from 'next/app';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

export default MyApp;
