import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    // Module imports
    UsersModule,
    BrandsModule,
    ProductsModule,
    SalesModule,

    // Config imports
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // Environment
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api'),

        // Database
        MONGODB_URI: Joi.string().required(),
      }),
    }),

    // Database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: 'sells-and-inventory-manager',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
