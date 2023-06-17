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

Your yaml config file `<projectRoot>/config/config.yaml`

```yaml
app:
  mongo:
    connection:
      type: 'mongodb'
      url: 'mongodb://${MONGO_USERNAME|root}:${MONGO_PASSWORD|root}@${MONGO_HOSTNAME|localhost}:27017/${MONGO_DATABASE|scheduler}?authSource=admin'
      useUnifiedTopology: false
      useNewUrlParser: true
```

This syntax means that it if `MONGO_USERNAME` for example is set up, it will use value from it,
instead it going to use value after `|` sign. It this case it is root.

In case of using production and other specific environments 
it is possible to add related config file `<projectRoot>/config/config.production.yaml`.

In this case you have to run your application with related `NODE_ENV=production`.
Module merges env related config into common config: `config.production.yaml` into `config.yaml`.

So, lets imaging that our production mongo config contains different attributes:

```yaml
    retryWrites: false
    replicaSet: 'rs0'
    readPreference: 'secondaryPreferred'
    sslCA: '/path/to/my/rds-combined-ca-bundle.pem'
```

So `<projectRoot>/config/config.production.yaml` will look like:

```yaml
app:
  mongo:
    connection:
      retryWrites: false
      replicaSet: 'rs0'
      readPreference: 'secondaryPreferred'
      sslCA: '/path/to/my/rds-combined-ca-bundle.pem'
```

Other props it takes from basic config file `<projectRoot>/config/config.yaml`.

Don't forget to add this into your `main.ts`:

`global.__baseDir = __dirname.replace('/dist', '');`

Your `app.module.ts`:

```typescript

import { ConfigService } from '@nestjs/config';
import { ConfigModule  } from '@goodandco/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { TConfig } from 'src/types/config';

@Module({
  imports: [
    ConfigModule.forRoot<TConfig>({}),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        ...configService.get<MongoConnectionOptions>('app.mongo.connection'),
        entities: [],
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    })
```
In the same way you be able to use `ConfigService` from any part of your app.

Your be able to specify type of your config structure. Here in example it is described in
`TConfig` definition. Or you can use `any` or `Record<string, any>`. Both these options are not recommended.

Once you load your config it stores as singleton and will use afterwards during ConfigService initiation.
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

## License

Nest-Config is [MIT licensed](LICENSE).
