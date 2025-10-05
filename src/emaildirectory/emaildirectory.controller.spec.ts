import { Test, TestingModule } from '@nestjs/testing';
import { EmaildirectoryController } from './emaildirectory.controller';
import { EmaildirectoryService } from './emaildirectory.service';

describe('EmaildirectoryController', () => {
  let controller: EmaildirectoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmaildirectoryController],
      providers: [EmaildirectoryService],
    }).compile();

    controller = module.get<EmaildirectoryController>(EmaildirectoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
