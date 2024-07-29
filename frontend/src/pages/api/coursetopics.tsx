import ApiClient from '@/utils/ApiClient';

export default async function handler(req: any, res: any) {
  try {
    const apiClient = new ApiClient();
    apiClient.setUrl(process.env.BACKEND_URL);
    console.log(process.env.BACKEND_URL, req.body);

    const response = await apiClient.get(
      `course_topics`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(response);
    return res.status(200).json(response);
  } catch (error: any) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
