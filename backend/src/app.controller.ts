import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  public async getHello(): Promise<void> {
    await this.appService.getFunds();
  }
}
