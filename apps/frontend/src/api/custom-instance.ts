import Axios, { AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: 'http://localhost:3001'
});

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token
  }).then(({ data }) => data);

  // @ts-expect-error
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export type ErrorType<Error> = Error;
