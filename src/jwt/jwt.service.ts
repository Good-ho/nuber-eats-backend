import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions, // private readonly configService:ConfigService
  ) {}

  sign(payload: object): string {
    // configservice 에서 secretkey를 가져와도 되지만, provider를 직접 만들어 사용할 수 있다는 관점에서 써봄
    //   return jwt.sign(payload, this.configService.get("SECRET_KEY"))
    return jwt.sign(payload, this.options.privateKey);
  }
}
