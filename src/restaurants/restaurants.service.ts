import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditRestaurantInput } from './dtos/edit-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurants.entity';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      // repository create는 entity를 instance를 만드는 것이고 db에 저장하려면 save필요.
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'could not create restaurant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditProfileOutput> {
    try {
      const findRestaurant = await this.restaurants.findOne(
        editRestaurantInput.restaurantID,
      );
      if (!findRestaurant) {
        return {
          ok: false,
          error: 'Restaurant Not Found',
        };
      }

      if (owner.id !== findRestaurant.ownerId) {
        return {
          ok: false,
          error: "You Can't edit Restaurant that you don't own.",
        };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantID,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could Not Found Restaurant',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const findRestaurant = await this.restaurants.findOne(
        deleteRestaurantInput.restaurantId,
      );

      if (!findRestaurant) {
        return {
          ok: false,
          error: 'Not Found Restaurant',
        };
      }

      if (owner.id !== findRestaurant.ownerId) {
        return {
          ok: false,
          error: "You Can't delete Restaurant that you don't own.",
        };
      }

      await this.restaurants.delete(deleteRestaurantInput.restaurantId);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could Not Found Restaurant',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load Categories',
      };
    }
  }

  countRestaurant(category: Category) {
    return this.restaurants.count({ category });
  }
}
