import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  console.log("BACKEND DB URI =>", process.env.MONGO_URI);

  const app = await NestFactory.create(AppModule);

  // ---- SWAGGER SETUP ----
  const config = new DocumentBuilder()
    .setTitle('Employee Profile API')
    .setDescription('API documentation for Employee Profile, Change Requests, Disputes, and Manager Views')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
   // ---- START APPLICATION ----
  await app.listen(process.env.PORT || 3000);

  console.log("USING DB URI:", process.env.MONGO_URI);
 console.log(`Swagger running at http://localhost:${process.env.PORT || 3000}/api ✅`);

}

bootstrap();