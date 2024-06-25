import ApiClient from './ApiClient';

export type LoginObject = {
  username: string;
  password: string;
};

const execAPI = (success: (a: ApiClient) => any, fail?: (e: any) => void) => {
  const apiClient = new ApiClient();
  apiClient.setUrl();
  try {
    return success(apiClient);
  } catch (e: any) {
    console.log('errorstatus -', e.response);
    apiClient.processError(e);
    if (fail) {
      fail(e);
    }
    throw e;
  }
};

export const initChat = async (payload: any): Promise<any> => {
  console.log('get chat init', payload);
  return execAPI(async (apiClient) => {
    const response = await apiClient.post<any>('/initchat', payload);
    return response;
  });
};

export const chat = async (payload: any): Promise<any> => {
  console.log('get chat init', payload);
  return execAPI(async (apiClient) => {
    const response = await apiClient.post<any>('/chat', payload);
    return response;
  });
};

export const getcourses = async (): Promise<any> => {
  console.log('get courses list');
  return execAPI(async (apiClient) => {
    const response = await apiClient.get<any>('/courses');
    return response;
  });
};


export const getCurrentCourse = async (payload: any): Promise<any> => {
  console.log('get courses list');
  return execAPI(async (apiClient) => {
    const response = await apiClient.post<any>('/coursedetails',payload);
    return response;
  });
};

