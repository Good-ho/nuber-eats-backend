import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

@InputType()
export class UpdateRestauranInputType extends PartialType(
  CreateRestaurantDto,
) {}

// @ArgsType()
@InputType()
export class UpdateRestaurantDto {
  @Field((type) => Number)
  id: number;

  @Field((type) => UpdateRestauranInputType)
  data: UpdateRestauranInputType;
}
