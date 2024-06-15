/* eslint-disable class-methods-use-this */
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

class ApiClient {
  private baseUrl: string | undefined;

  private headers: { [key: string]: string } = {};

  public setUrl(url?: string): void {
    this.baseUrl = url ?? '/api';
    console.log(this.baseUrl);
  }

  public setToken(token: string): void {
    this.headers.Authorization = `Bearer ${token}`;
  }

  public setHeaders(customHeaders: { [key: string]: string }): void {
    this.headers = { ...this.headers, ...customHeaders };
  }

  private getTokenFromLocalStorage():
    | {
        [key: string]: string | null;
      }
    | undefined {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('UID');
      if (data) {
        const parsedData = JSON.parse(data);
        return {
          Authorization: `${parsedData?.token}` || null,
        };
      }
    }
    return undefined;
  }

  private getConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    const token = this.getTokenFromLocalStorage() || undefined;

    const modifiedConfig = {
      ...config,
      headers: {
        ...config?.headers,
        ...this.headers,
        ...token,
      },
    };
    return modifiedConfig;
  }

  public async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Base URL not set. Please call setUrl() first.');
    }
    console.log(this.getConfig(config));
    console.log(':config');
    console.log(`${this.baseUrl}${endpoint}`);
    const response: AxiosResponse<T> = await axios.get<T>(
      `${this.baseUrl}${endpoint}`,
      this.getConfig(config),
    );
    console.log(response.data);
    return response.data;
  }

  public async post<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Base URL not set. Please call setUrl() first.');
    }
    console.log(`${this.baseUrl}${endpoint}`);

    const response: AxiosResponse<T> = await axios.post<T>(
      `${this.baseUrl}${endpoint}`,
      data,
      this.getConfig(config),
    );
    return response.data;
  }

  public async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Base URL not set. Please call setUrl() first.');
    }
    const response: AxiosResponse<T> = await axios.delete<T>(
      `${this.baseUrl}${endpoint}`,
      this.getConfig(config),
    );
    return response.data;
  }

  public async patch<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Base URL not set. Please call setUrl() first.');
    }
    const response: AxiosResponse<T> = await axios.patch<T>(
      `${this.baseUrl}${endpoint}`,
      data,
      this.getConfig(config),
    );
    return response.data;
  }

  public async put<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Base URL not set. Please call setUrl() first.');
    }
    const response: AxiosResponse<T> = await axios.put<T>(
      `${this.baseUrl}${endpoint}`,
      data,
      this.getConfig(config),
    );
    return response.data;
  }

  public processError = (error: AxiosError): void => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Error Status:', error.response.status);
      console.log('Error Message:', error.response.data);

      if (error.response.status === 401) {
        console.log('logging user out');
        if (typeof window !== 'undefined') {
          // logout user
          localStorage.removeItem('UID');
          // if (router) router.push('/login');

          // window.location.reload();
        }
      }

      // For more detailed error information:
      // console.log('Error Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response was received', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log('Error Config:', error.config);
  };
}

export default ApiClient;
