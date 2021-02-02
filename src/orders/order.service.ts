import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      let orderFinalPrice = 0;
      const orderItemArray: OrderItem[] = [];

      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: 'Dish Not found',
          };
        }
        let dishFinalPrice = dish.price;

        console.log(`Dish Price : ${dish.price}`);
        // dishOption에서 유저가 보낸 options이 존재하는지 check
        for (const itemOptions of item.options) {
          // console.log(itemOptions);
          // user가 보낸 option이 dishoption db에 존재하는지 확인
          // 이게 필요한 이유? 돈계산하기 위해.
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOptions.name,
          );
          if (dishOption) {
            // dishoptions에 extra가 있을 수 있고, dishoptions -> choice에 extra가 있을 수 있으니 둘다 체크.
            if (dishOption.extra) {
              dishFinalPrice = dishFinalPrice + dishOption.extra;
              console.log(`USD(1) + ${dishOption.extra}`);
            } else {
              const dishOptionsChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOptions.choice,
              );
              // console.log(dishOptionsChoice);
              if (dishOptionsChoice) {
                if (dishOptionsChoice.extra) {
                  dishFinalPrice = dishFinalPrice + dishOptionsChoice.extra;
                  console.log(`USD(2) + ${dishOptionsChoice.extra}`);
                }
              }
            }
          }
        }

        orderFinalPrice = orderFinalPrice + dishFinalPrice;

        const orderitem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItemArray.push(orderitem);
      }

      // console.log(orderItemArray);

      console.log(`total : ${orderFinalPrice}`);
      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItemArray,
        }),
      );

      return {
        ok: true,
      };
      // console.log(order);
    } catch {
      return {
        ok: false,
        error: 'Could not create order',
      };
    }
  }
}
