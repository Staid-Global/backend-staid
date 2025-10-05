import { Test, TestingModule } from '@nestjs/testing';
import { BunkernoteController } from './bunkernote.controller';
import { BunkernoteService } from './bunkernote.service';

describe('BunkernoteController', () => {
  let controller: BunkernoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BunkernoteController],
      providers: [BunkernoteService],
    }).compile();

    controller = module.get<BunkernoteController>(BunkernoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
