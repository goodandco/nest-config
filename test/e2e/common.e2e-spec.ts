import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../../src';

global.__baseDir = __dirname + '/fixtures';

describe('Config Module', () => {
  it('boots successfully', async () => {
    // Arrange
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({})],
    }).compile();
    // Act
    const app = testingModule.createNestApplication();
    await app.init();
    // Assert
  });
});
