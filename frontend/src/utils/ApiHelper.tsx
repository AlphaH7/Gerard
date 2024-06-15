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

export const loginUser = async (payload: LoginObject): Promise<any> => {
  console.log(payload);
  return execAPI(async (apiClient) => {
    const response = await apiClient.post<any>('/login', payload);
    return response;
  });
};
