import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
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
  async createRestaurants(
    @Args('input') createRestaurantInput: CreateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurnatService.createRestaurant(createRestaurantInput);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @Mutation((returns) => Boolean)
  async updateRestaurant(
    // updateRestaurnDto가 inputtype이라면 args('input') 이런식으로 써줘야하고
    // argsType이라면 args() 이렇게 비워놓으면 된다.
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return true;
  }
}
