import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// export class JwtMiddleware implements NestMiddleware {
//   use(req: Request, res: Response, next: NextFunction) {
//     console.log(req.headers);
//     next();
//   }
// }

// 위와 같이 class로 해도되고 아래와 같이 function으로 해도된다.
export function JwtMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(req.headers);
  next();
}
