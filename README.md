## Installation

```bash
$ npm install @goodandco/nest-config
```

## Using

First add this line to the top of yours `main.ts` file:

```typescript

global.__baseDir = __dirname.replace('/dist', '');
```
If you have different root dir for your compiled code, 
then specify related directory instead of `/dist`

set up configuration yaml in `<projectRoot/config/config.yaml`. 
This is the root config file. According to NODE_ENV and existance of `<projectRoot>/config/config.<NODE_ENV>.yaml`
they will be merged with NODE_ENV's config prefer.

In your `app.module.ts` add next:

```typescript
import { TConfig } from './shared';
import { ConfigModule } from '@goodandco/nest-config';

@Module({
  imports: [
    ConfigModule.forRoot<TConfig>(),
  ...
```

Your could specify `TConfig` as type of your configuration and use. 
Also there are could be cases when you need access to your config in decorator level.
So it means that config required before the app has been inited. For that reasons you can
use next approach with `ConfigLoader.config` method:

```typescript
import { TConfig } from '../shared';
import { ConfigLoader } from '@goodandco/nest-config'
const {
  app: {
    consumer: { topic: kafkaTopic },
  },
} = ConfigLoader.config<TConfig>();

@Controller('consumer')
export class ConsumerController {
  ...
  
  @MessagePattern(kafkaTopic)
  async consume(
    @Payload() dto: DTO
  ) {
    try {
      await this.consumerService.process(dto);
   ...
}
```

Once you load your config it stores as singleton and will use afterwards during ConfigService initiation.
