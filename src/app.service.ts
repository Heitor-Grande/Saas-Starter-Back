import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Bem vindo à API do Saas Starter Back-End!',
      timestamp: new Date().toISOString(),
    };
  }
}
