import { config as loadEnv } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env from the repo root, walking up from __dirname the same way
// EraService locates the eras/ directory. This makes OPENROUTER_API_KEY
// available regardless of where the process is launched from.
let dir = __dirname;
while (dir !== path.parse(dir).root) {
  const envPath = path.join(dir, '.env');
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
  dir = path.dirname(dir);
}

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
