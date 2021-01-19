import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { loginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  //createAccount(createAccountInput:CreateAccountInput){
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    // 1. check that email does not exists
    // 2. create the user && hash the password
    try {
      const exists = await this.user.findOne({ email });
      if (exists) {
        // make error
        return { ok: false, error: 'already exists' };
      }
      const findUser = await this.user.save(
        this.user.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({ user: findUser }),
      );

      this.mailService.sendVerificationEmail(findUser.email, verification.code);
      return { ok: true };
    } catch (e) {
      //make error
      return { ok: false, error: 'can not create user' };
    }
  }

  async login({ email, password }: loginInput): Promise<LoginOutput> {
    // 1, find user with the email
    // 2. check if the password is correct
    // 3. make a JWT and give it to the user
    try {
      const user = await this.user.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          ok: false,
          error: 'User Not Found',
        };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong Password',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const findUser = await this.user.findOne({ id });
      if (findUser) {
        return {
          ok: true,
          user: findUser,
        };
      }
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  // 아래와 같이 {email, password}로 받으면, resolver에서 password값을 넘겨주지 않으면 password를 undefined로 만들어버림
  // db는 password가 null or undefined로 전달되면 error가 나옴!
  // async editProfile(userId: number, { email, password }: EditProfileInput) {
  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      console.log(userId);
      const findUser = await this.user.findOne(userId);
      if (email) {
        findUser.email = email;
        findUser.verified = false;
        const verification = await this.verifications.save(
          this.verifications.create({ user: findUser }),
        );

        this.mailService.sendVerificationEmail(
          findUser.email,
          verification.code,
        );
      }

      if (password) {
        findUser.password = password;
      }

      await this.user.save(findUser);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.user.save(verification.user);
        await this.verifications.delete(verification.id);
        return {
          ok: true,
        };
      }
      throw new Error();
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
