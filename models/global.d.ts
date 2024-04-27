import { Request } from 'express';

export interface AuthJwtToken extends Request {
  user?: string; // or any other type
}
