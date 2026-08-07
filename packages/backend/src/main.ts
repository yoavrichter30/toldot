import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:5173' });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Toldot backend running on http://localhost:${port}`);
}
bootstrap();
