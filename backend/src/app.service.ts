import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { abi } from '../DomainRegistry.json';

@Injectable()
export class AppService {
  private readonly domainRegistry: ethers.Contract;

  constructor(configService: ConfigService) {
    const signingKey = new ethers.SigningKey(
      configService.get<string>('PRIVATE_KEY'),
    );
    const provider = new ethers.InfuraProvider(
      configService.get<string>('NETWORK_BLOCKCHAIN'),
      configService.get<string>('INFURA_PROJECT_ID'),
      configService.get<string>('INFURA_API_KEY'),
    );
    const wallet = new ethers.Wallet(signingKey, provider);
    this.domainRegistry = new ethers.Contract(
      configService.get<string>('CONTRACT_ADDRESS'),
      abi,
      wallet,
    );
  }

  public async getFunds(): Promise<void> {
    try {
      const withdrawEth = await this.domainRegistry.withdrawEth();

      await withdrawEth.wait();

      const withdrawUsdc = await this.domainRegistry.withdrawUsdc();

      await withdrawUsdc.wait();
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
