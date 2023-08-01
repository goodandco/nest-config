import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { ConfigObject } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces/config-factory.interface';
import deepMerge from './config.utils';
import { TConfigModuleOptions } from './config.types';

const { DEBUG_MODE = '0' } = process.env;
const CONFIG_MAP = new Map<string, ConfigObject>();

function keyGen(list: string[]): string {
  return list.join('-');
}

export class ConfigLoader {
  static read<TConfigType extends ConfigObject>(
    configPathName: string,
  ): TConfigType | Partial<TConfigType> {
    try {
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

  static calculateConfigFileNames(options: TConfigModuleOptions) {
    const { configNameList = null } = options;

    const { NODE_ENV: env = 'default' } = process.env;

    const defaultConfig = `/config/config.yaml`;
    const defaultEnvConfig = `/config/config.${env}.yaml`;

    const defaultConfigNameList = process.argv.includes('--configPath')
      ? [process.argv[process.argv.indexOf('--configPath') + 1]]
      : [defaultConfig, defaultEnvConfig];

    return (configNameList || defaultConfigNameList)
      .map((configName) => ConfigLoader.buildPath(configName))
      .filter((configPathName) =>
        ConfigLoader.checkFileExisting(configPathName),
      );
  }

  static loadByConfigFileNames<TConfigType extends ConfigObject>(
    configFileNameList: Array<string>,
  ): Array<ConfigFactory<TConfigType>> {
    const { NODE_ENV: env = 'default' } = process.env;
    const configKey = keyGen(configFileNameList);
    const existedConfig = CONFIG_MAP.get(configKey);

    if (existedConfig) {
      return [() => existedConfig] as Array<ConfigFactory<TConfigType>>;
    }

    const configFactoryList = configFileNameList.map(
      (configPathName: string) => () =>
        ConfigLoader.read<TConfigType>(configPathName),
    ) as Array<ConfigFactory<TConfigType>>;

    const configList: Array<ConfigObject> = configFactoryList.map((fn) => fn());
    const configResult: TConfigType = deepMerge(...configList.reverse());
    CONFIG_MAP.set(configKey, configResult);
    if (DEBUG_MODE === '1') {
      console.log('NODE_ENV ', env);
      console.log(`Considered config files: `, configFileNameList);
      console.log('Result config: ', JSON.stringify(configResult));
    }

    return [() => configResult] as Array<ConfigFactory<TConfigType>>;
  }

  static load<TConfigType extends ConfigObject>(
    options: TConfigModuleOptions,
  ): Array<ConfigFactory<TConfigType>> {
    const configFileNames = ConfigLoader.calculateConfigFileNames(options);

    return ConfigLoader.loadByConfigFileNames(configFileNames);
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
    const configFileNames = ConfigLoader.calculateConfigFileNames(options);
    const configKey = keyGen(configFileNames);
    const existed = CONFIG_MAP.get(configKey);
    if (existed) {
      return existed as TConfigType;
    }

    ConfigLoader.loadByConfigFileNames(configFileNames);

    const result = CONFIG_MAP.get(configKey) as TConfigType;

    if (!result) {
      throw new Error(
        'There is a problem with loading the config. Try to run with DEBUG_MODE=1 to debug.',
      );
    }

    return result as TConfigType;
  }
}
