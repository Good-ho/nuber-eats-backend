import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  OmitType,
} from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurants.entity';

@InputType()
export class CreateRestaurantInput extends OmitType(Restaurant, [
  'id',
  'category',
  'owner',
]) {}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
