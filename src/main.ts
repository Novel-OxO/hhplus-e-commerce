import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './infrastructure/di/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('HH Plus E-Commerce API')
    .setDescription('E-Commerce API Documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 8000);
}

bootstrap();
