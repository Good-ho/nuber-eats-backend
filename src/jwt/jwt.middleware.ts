import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { decode } from 'querystring';
import { UsersService } from 'src/users/user.service';
import { JwtService } from './jwt.service';

// injectable로 설정하자. 이렇게 하지 않으면, dependency injection을 하기 어렵기 때문.
// 즉, 아래 constructor에서 jwtservice를 dependency injection하기 위해서는 jwtmiddleware도 injectable로 되어있어야함.
@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    // 위 juwtservice는 jwt module에서 export 설정되어 있어 접근 할 수 있지만, 아래 userservice추가하면 not found에러가 나올 것이다.
    // 따라서, jwt moudle과 같이 user module에서도 service export설정이 필요하다.
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      //   console.log(req.headers['x-jwt']);
      const token = req.headers['x-jwt'];
      // token을 받았으면, 이 token이 맞는지 확인하는 로직이 필요하다.
      // 이 로직은 jwt service에서 구현하자.
      const decoded = this.jwtService.verify(token.toString());
      // verify는 string or object를 반환하기 때문에 decoded.id 이렇게 접근할 수 없다.
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        // decode로 반환된 id 값을 확인하여 user가 누군지 확인 가능.
        // console.log(decoded['id']);

        try {
          const user = await this.userService.findById(decoded['id']);
          console.log(user);
          // headers에서 user를 request로 보낼수 있는 middleware구현완료
          req['user'] = user;
        } catch (error) {}
      }
    }
    next();
  }
}

// 위와 같이 class로 해도되고 아래와 같이 function으로 해도된다.
// export function JwtMiddleware(req: Request, res: Response, next: NextFunction) {
//   console.log(req.headers);
//   next();
// }
