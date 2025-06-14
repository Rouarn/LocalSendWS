import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/' + 'public',
    maxAge: 86400,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap()
  .then(() => {
    console.log(`Server started on port ${process.env.PORT ?? 3000}`);
  })
  .catch((err) => {
    console.error(err);
  });
