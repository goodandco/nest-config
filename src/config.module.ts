import { DynamicModule, Global, Module } from '@nestjs/common';
import { TConfigModuleOptions } from './config.types';
import { ConfigLoader } from './config.loader';
import { ConfigObject, ConfigModule as NestConfigModule } from '@nestjs/config';
import { CONFIG_OPTIONS } from './config.constants';

@Global()
@Module({})
export class ConfigModule {
  public static forRoot<TConfigType extends ConfigObject>(
    options: TConfigModuleOptions,
  ): DynamicModule {
    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          load: ConfigLoader.load<TConfigType>(options),
        }),
      ],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
    } as DynamicModule;
  }
}
