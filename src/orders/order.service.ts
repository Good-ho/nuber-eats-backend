import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

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

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let findOrders: Order[];

      if (user.role === UserRole.Client) {
        findOrders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        findOrders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const findRestaurants = await this.restaurants.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });

        findOrders = findRestaurants
          .map((restaurant) => restaurant.orders)
          .flat(1);
        // console.log(findOrders);

        if (status) {
          findOrders = findOrders.filter((order) => order.status === status);
          //map은 새로운 배열을 만들고, filter는 조건을 충족하지 못하는 놈 제외 시킴
        }
      }
      return {
        ok: true,
        orders: findOrders,
      };
    } catch {
      return {
        ok: false,
        error: 'getOrder exception',
      };
    }
  }

  canSeeOrder(user: User, order: Order): boolean {
    let result = true;

    if (user.role === UserRole.Client && order.customerId !== user.id) {
      result = false;
    }

    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      result = false;
    }

    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      result = false;
    }

    return result;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: 'order not found',
        };
      }

      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "you can't see that",
        };
      }

      return {
        ok: true,
        order,
      };
    } catch {
      return {
        ok: false,
        error: 'getorder exception',
      };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const findOrder = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!findOrder) {
        return {
          ok: false,
          error: 'not found order',
        };
      }

      if (!this.canSeeOrder(user, findOrder)) {
        return {
          ok: false,
          error: "you can't see that",
        };
      }

      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }

      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }

      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.Delivered &&
          status !== OrderStatus.PickedUp
        ) {
          canEdit = false;
        }
      }

      if (!canEdit) {
        return {
          ok: false,
          error: "You can't edit",
        };
      }

      await this.orders.save([
        {
          id: orderId,
          status,
        },
      ]);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'editorder exception',
      };
    }
  }
}
