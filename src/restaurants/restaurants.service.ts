import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurants.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    // 아래와 같은 방식으로 할 수 도 있으나, 모든 member 변수들에게 값을 할당하는 건 매우 비효율적이다.
    // const newRestaurant = new Restaurant();
    // newRestaurant.name = createRestaurant.name;

    // this.restaurant.create를 통해 쉽게 생성가능.
    // 이미 우리는 entity에서 createRestaurant 인자에 대한 유효성을 체크했음. (typeorm, typescript의 장점)
    const newRestaurant = this.restaurants.create(createRestaurantDto);

    // repository create는 entity를 instance를 만드는 것이고 db에 저장하려면 save필요.
    return this.restaurants.save(newRestaurant);
  }

  updateRestaurant(updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurants.update(updateRestaurantDto.id, {
      ...updateRestaurantDto.data,
    });
  }
}
