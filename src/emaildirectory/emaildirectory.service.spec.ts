import { Test, TestingModule } from '@nestjs/testing';
import { EmaildirectoryService } from './emaildirectory.service';

describe('EmaildirectoryService', () => {
  let service: EmaildirectoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmaildirectoryService],
    }).compile();

    service = module.get<EmaildirectoryService>(EmaildirectoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
