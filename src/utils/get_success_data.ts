import { ResponseType } from '../interfaces/ResponseType';


export function get_success_data(data: any): ResponseType {
  return {
    data,
    errors: [],
  };
}
