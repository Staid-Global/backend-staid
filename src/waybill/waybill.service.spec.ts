import { Test, TestingModule } from '@nestjs/testing';
import { WaybillService } from './waybill.service';

describe('WaybillService', () => {
  let service: WaybillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaybillService],
    }).compile();

    service = module.get<WaybillService>(WaybillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
