import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { loginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
  ) {}

  //createAccount(createAccountInput:CreateAccountInput){
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // 1. check that email does not exists
    // 2. create the user && hash the password
    try {
      const exists = await this.user.findOne({ email });
      if (exists) {
        // make error
        return { ok: false, error: 'already exists' };
      }
      await this.user.save(this.user.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      //make error
      return { ok: false, error: 'can not create user' };
    }
  }

  async login({
    email,
    password,
  }: loginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // 1, find user with the email
    // 2. check if the password is correct
    // 3. make a JWT and give it to the user
    try {
      const user = await this.user.findOne({ email });
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

      return {
        ok: true,
        token: 'lalala',
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
