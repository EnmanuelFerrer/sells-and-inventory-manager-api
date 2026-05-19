import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>('PORT') as number;
  const apiPrefix = configService.get<string>('API_PREFIX') as string;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix(apiPrefix);

  await app.listen(port, () => {
    logger.log(`API prefix: ${apiPrefix}`);
    logger.log(`Listening on port ${port}`);
  });
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(error);
  process.exit(1);
});
