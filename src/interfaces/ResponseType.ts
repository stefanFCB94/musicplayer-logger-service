import { ResponseError } from './ResponseError';

export interface ResponseType {
  data: any;
  errors: ResponseError[];
}
