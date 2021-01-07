import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './restaurants.entity';
import { RestaurantService } from './restaurants.service';

@Resolver((of) => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurnatService: RestaurantService) {}

  @Query((returns) => [Restaurant])
  myRestaurant(): Promise<Restaurant[]> {
    return this.restaurnatService.getAll();
  }
  @Mutation((returns) => Boolean)
  createRestaurants(
    @Args() createRestaurantInput: CreateRestaurantDto,
  ): boolean {
    return true;
  }
}
