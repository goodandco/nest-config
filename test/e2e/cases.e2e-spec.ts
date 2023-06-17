import { Test, TestingModule } from '@nestjs/testing';
import { ConfigLoader, ConfigModule } from '../../src';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

global.__baseDir = __dirname + '/fixtures';

type TConfigTest = {
  foo: {
    bar: string;
  };
};

describe('Config Module', () => {
  it('uses config service successfully', async () => {
    // Arrange
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot<TConfigTest>({
          configNameList: ['mockConfig.yaml'],
        }),
      ],
    }).compile();

    // Act
    const app = testingModule.createNestApplication();
    await app.init();
    // Assert
    const configService = app.get(ConfigService);
    expect(configService.get('foo.bar')).toStrictEqual('test');
  });

  it('uses config service in dependency successfully', async () => {
    // Arrange
    @Injectable()
    class TestService {
      constructor(private configService: ConfigService) {}

      test() {
        return this.configService.get('foo.bar');
      }
    }
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot<TConfigTest>({
          configNameList: ['mockConfig.yaml'],
        }),
      ],
      providers: [TestService],
    }).compile();

    // Act
    const app = testingModule.createNestApplication();
    await app.init();
    // Assert
    const testService = app.get<TestService>(TestService);
    expect(testService.test()).toStrictEqual('test');
  });

  it('uses in decorator from ConfigLoader successfully', async () => {
    // Arrange
    const {
      foo: { bar },
    } = ConfigLoader.config<TConfigTest>({
      configNameList: ['mockConfig.yaml'],
    });
    @Injectable()
    class TestService {
      constructor(private configService: ConfigService) {}

      test() {
        return this.configService.get('foo.bar') === bar;
      }
    }
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          configNameList: ['mockConfig.yaml'],
        }),
      ],
      providers: [TestService],
    }).compile();

    // Act
    const app = testingModule.createNestApplication();
    await app.init();
    // Assert
    const testService = app.get<TestService>(TestService);
    expect(testService.test()).toBe(true);
  });
});
