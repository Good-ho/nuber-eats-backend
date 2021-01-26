import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';

// npm module mock 하는 방법
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
  };
});

const TEST_KEY = 'testKey';

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      // 아래와 같이 테스트 해보면 token이 정상적으로 나온다.
      // 하지만, 아래와 같은 테스트는 npm module연동해서 얻은 결과다.
      // 현재 우리는 unit testing을 하고 있으므로 jsonwebtoken module을 mock해야한다.
      // 위 jsonwebtoken을 mock하면 아래 token이 우리가 설정한 token으로 반환된다!
      //   const token = service.sign(1);
      //   console.log(token);
      const token = service.sign(1);
      // 아래와 같이 jwt를 import하여 jwt.sign을 호출하더라도 위에서 jwt sign을 moc하고 있으므로
      // Mock된 결과 값이 나옴.
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, TEST_KEY);
    });
  });

  describe('verify', () => {
    it('should return the decoded token', () => {});
  });
});
