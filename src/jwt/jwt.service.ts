import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interfaces';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions, // private readonly configService:ConfigService
  ) {
    // console.log(options);
  }

  sign(userId: number): string {
    // configservice 에서 secretkey를 가져와도 되지만, provider를 직접 만들어 사용할 수 있다는 관점에서 써봄
    //   return jwt.sign(payload, this.configService.get("SECRET_KEY"))
    return jwt.sign({ id: userId }, this.options.privateKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
