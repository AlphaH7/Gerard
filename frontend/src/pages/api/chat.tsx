// @ts-nocheck

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.BACKEND_URL}chat?chat_session_id=4a8f964f-b4c6-45eb-b958-7b9b39ed6bcc`,
      data: req.body,
      responseType: 'stream', // This is important to handle streaming response
    });

    // Forward the response headers
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the streaming response to the client
    response.data.pipe(res);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
