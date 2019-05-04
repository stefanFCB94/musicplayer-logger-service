import { ResponseType } from '../interfaces/ResponseType';


export function get_error_data(error: Error | Error[]): ResponseType {
  let err: Error | Error[] = error;

  if (!Array.isArray(err)) {
    err = [err];
  }

  return {
    data: null,
    errors: err.map(err => ({ type: err.constructor.name, message: err.message })),
  };
}
