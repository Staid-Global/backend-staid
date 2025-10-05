import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT ?? 4647;
  const app = await NestFactory.create(AppModule, { cors: { origin: '*' } });

  const config = new DocumentBuilder()
    .setTitle('STAID API')
    .setDescription(`The API for STAID API`)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(port);
  app.enableCors();
  console.log(`Server running on port ${port}`);
  console.log(`http://localhost:${port}/docs`);
}
bootstrap();
