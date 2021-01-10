import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
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
}
