import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';

jest.mock('got', () => {});
jest.mock('form-data', () => {
  return {
    append: jest.fn(),
  };
});

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'test-apiKey',
            domain: 'test-domain',
            fromEmail: 'test-fromEmail',
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificationEmailArgs = {
        email: 'email',
        code: 'code',
      };

      // 아래 expect(service.sendEmail) 구문에서 에러발생
      // 왜냐면, sendEmail은 mock으로 되어있지 않기 때문.
      // 우리는 마지막에 sendEmail에 대한 unit testing을 해야하므로 jest.fn() 이런 식으로 mock하면 문제생긴다.
      // 여기서 새로운 개념은 spy 함수를 사용하자.
      // spyOn은 아래와 같이 원하는 함수를 가로채서 implementation할 수 있다.
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => {
        // console.log('i love you');
      });

      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );

      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify your email',
        'confirmemail',
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });

  it.todo('sendEmail');
});
