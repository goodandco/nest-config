import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { ConfigObject } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces/config-factory.interface';
import deepMerge from './config.utils';
import { TConfigModuleOptions } from './config.types';

let CONFIG: ConfigObject | null = null;
export class ConfigLoader {
  static read<TConfigType extends ConfigObject>(
    configPathName: string,
  ): TConfigType | Partial<TConfigType> {
    try {
      console.log(configPathName);
      return yaml.load(
        ConfigLoader.replaceEnvVars(readFileSync(configPathName, 'utf8')),
      ) as TConfigType;
    } catch (err) {
      console.log('And error happened while reading config: ', err.message);
      return {} as Partial<TConfigType>;
    }
  }

  static replaceEnvVars(content): string {
    return content.replace(/\${([A-Z0-9_]+(|[^}]+)?)}/gi, (_, entry) => {
      // eslint-disable-next-line prefer-const
      let [name, defaultValue] = entry.split('|');
      name = name.trim();

      if (process.env[name]) {
        return process.env[name];
      }

      if (defaultValue) {
        return defaultValue.trim();
      }

      throw new Error(`Env variable '${name}' is not set`);
    });
  }

  static load<TConfigType extends ConfigObject>(
    options: TConfigModuleOptions,
  ): Array<ConfigFactory<TConfigType>> {
    const { configNameList = null } = options;

    if (CONFIG) {
      return [() => CONFIG] as Array<ConfigFactory<TConfigType>>;
    }
    const { NODE_ENV: env = 'default' } = process.env;
    console.log('NODE_ENV ', env);
    const defaultConfig = `/config/config.yaml`;
    const defaultEnvConfig = `/config/config.${env}.yaml`;

    const defaultConfigNameList = process.argv.includes('--configPath')
      ? [process.argv[process.argv.indexOf('--configPath') + 1]]
      : [defaultConfig, defaultEnvConfig];

    const list = configNameList || defaultConfigNameList;
    const res = list
      .map((configName) => ConfigLoader.buildPath(configName))
      .filter((configPathName) =>
        ConfigLoader.checkFileExisting(configPathName),
      )
      .map(
        (configPathName: string) => () =>
          ConfigLoader.read<TConfigType>(configPathName),
      ) as Array<ConfigFactory<TConfigType>>;

    const configList: Array<ConfigObject> = res.map((fn) => fn());
    CONFIG = deepMerge(...configList.reverse());
    console.log(JSON.stringify(CONFIG));
    return [() => CONFIG] as Array<ConfigFactory<TConfigType>>;
  }

  static buildPath(fileName: string): string {
    const baseDir = global.__baseDir || './';
    return path.join(baseDir, fileName);
  }

  static checkFileExisting(filePathName: string): boolean {
    try {
      return existsSync(filePathName);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  static config<TConfigType extends ConfigObject>(
    options?: TConfigModuleOptions,
  ): TConfigType {
    if (!CONFIG) {
      ConfigLoader.load<TConfigType>(options);
    }

    return CONFIG as TConfigType;
  }
}
