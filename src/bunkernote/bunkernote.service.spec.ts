import { Test, TestingModule } from '@nestjs/testing';
import { BunkernoteService } from './bunkernote.service';

describe('BunkernoteService', () => {
  let service: BunkernoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BunkernoteService],
    }).compile();

    service = module.get<BunkernoteService>(BunkernoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
