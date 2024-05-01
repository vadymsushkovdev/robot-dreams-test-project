const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const {
  takeSnapshot,
} = require('@nomicfoundation/hardhat-network-helpers');
const { BigNumber } = require('ethers');

describe('DomainRegistry', function () {
  let snapshotA;
  let DomainRegistry;
  let domainRegistry;
  let PriceFeed;
  let priceFeed;
  let UsdcToken;
  let usdcToken;
  let owner;
  let addr1;
  let oneUsdcInTokens;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    const price = ethers.parseUnits('50', 6);

    PriceFeed = await ethers.getContractFactory('PriceFeed');
    priceFeed = await PriceFeed.deploy();
    await priceFeed.waitForDeployment();

    UsdcToken = await ethers.getContractFactory('USDC');
    usdcToken = await UsdcToken.deploy();
    await usdcToken.waitForDeployment();

    DomainRegistry =
      await ethers.getContractFactory('DomainRegistry');
    domainRegistry = await upgrades.deployProxy(DomainRegistry, [
      price,
      priceFeed.target,
      usdcToken.target,
    ]);
    await domainRegistry.waitForDeployment();

    snapshotA = await takeSnapshot();
  });

  afterEach(async () => await snapshotA.restore());

  describe('Deployment', function () {
    it('Should set the owner correctly', async function () {
      expect(await domainRegistry.owner()).to.equal(owner.address);
    });
  });

  describe('changePrice', function () {
    it('Should change the registration price', async function () {
      const newPrice = ethers.parseUnits('25', 6);

      const changePriceTx =
        await domainRegistry.changePrice(newPrice);

      expect(
        await domainRegistry.getRegistrationPriceInUsdc()
      ).to.equal(newPrice);

      expect(changePriceTx)
        .to.emit(domainRegistry, 'PriceChanged')
        .withArgs(newPrice);
    });

    it('Should revert if called by non-owner', async function () {
      const price = ethers.parseUnits('25', 6);

      await expect(domainRegistry.connect(addr1).changePrice(price))
        .to.be.revertedWithCustomError(
          domainRegistry,
          'OwnableUnauthorizedAccount'
        )
        .withArgs(addr1);
    });
  });

  describe('buyDomain', function () {
    it('Should buy a domain vie eth successfully', async function () {
      const domain = 'com';
      const price = await domainRegistry.getRegistrationPriceInEth();

      const buyDomainTransaction =
        await domainRegistry.buyDomainViaEth(domain, {
          value: price,
        });
      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      expect(buyDomainTransaction).to.changeEtherBalance(
        owner,
        price
      );

      expect(buyDomainTransaction)
        .to.emit(domainRegistry, 'DomainRegistered')
        .withArgs(domain, owner, blockTimestamp);
    });

    it('Should buy a domain vie usdc successfully', async function () {
      const domain = 'com';
      const price = await domainRegistry.getRegistrationPriceInUsdc();

      await usdcToken.approve(domainRegistry.target, price);

      const buyDomainTransaction =
        await domainRegistry.buyDomainViaUsdc(domain);

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      expect(
        await usdcToken.balanceOf(domainRegistry.target)
      ).to.be.equal(price);

      expect(buyDomainTransaction)
        .to.emit(domainRegistry, 'DomainRegistered')
        .withArgs(domain, owner, blockTimestamp);
    });

    it('Should revert if domain already taken', async function () {
      const domain = 'com';
      const price = await domainRegistry.getRegistrationPriceInEth();
      await domainRegistry.buyDomainViaEth(domain, { value: price });

      await expect(
        domainRegistry.buyDomainViaEth(domain, {
          value: price,
        })
      ).to.be.revertedWithCustomError(
        domainRegistry,
        'DomainAlreadyTaken'
      );
    });

    it('Should revert if value sent is incorrect', async function () {
      const domain = 'com';
      const price = await domainRegistry.getRegistrationPriceInEth();
      const wrongValue = price / BigInt(2);

      await expect(
        domainRegistry.buyDomainViaEth(domain, {
          value: wrongValue,
        })
      )
        .to.be.revertedWithCustomError(
          domainRegistry,
          'IncorrectValueAmount'
        )
        .withArgs(wrongValue, price);
    });
  });

  describe('withdraw', function () {
    it('Should withdraw eth funds from the contract', async function () {
      const domain = 'com';
      const price = await domainRegistry.getRegistrationPriceInEth();

      await domainRegistry.buyDomainViaEth(domain, {
        value: price,
      });

      const initialContractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(initialContractBalance).to.equal(price);

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const withdrawTx = await domainRegistry.withdrawEth();

      const contractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(contractBalance).to.equal(BigInt(0));

      expect(withdrawTx).to.changeEtherBalance(owner, price);

      expect(withdrawTx)
        .to.emit(domainRegistry, 'Withdrawal')
        .withArgs(price, blockTimestamp);
    });

    it('Should withdraw usdc funds from the contract', async function () {
      const domain = 'com';
      const price = await domainRegistry.getRegistrationPriceInUsdc();

      await usdcToken.approve(domainRegistry.target, price);

      await domainRegistry.buyDomainViaUsdc(domain);

      const initialContractBalance = await usdcToken.balanceOf(
        domainRegistry.target
      );

      expect(initialContractBalance).to.equal(price);

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const withdrawTx = await domainRegistry.withdrawUsdc();

      const contractBalance = await usdcToken.balanceOf(
        domainRegistry.target
      );

      expect(contractBalance).to.equal(BigInt(0));

      expect(withdrawTx).to.changeEtherBalance(owner, price);

      expect(withdrawTx)
        .to.emit(domainRegistry, 'Withdrawal')
        .withArgs(price, blockTimestamp);
    });

    it('Should revert if contract balance is zero', async function () {
      await expect(domainRegistry.connect(owner).withdrawEth())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'NothingToWithdraw'
        )
        .withArgs(owner);

      await expect(domainRegistry.connect(owner).withdrawUsdc())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'NothingToWithdraw'
        )
        .withArgs(owner);
    });

    it('Should revert if called by non-owner', async function () {
      await expect(domainRegistry.connect(addr1).withdrawEth())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'OwnableUnauthorizedAccount'
        )
        .withArgs(addr1);

      await expect(domainRegistry.connect(addr1).withdrawUsdc())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'OwnableUnauthorizedAccount'
        )
        .withArgs(addr1);
    });
  });

  describe('withdrawDomain', function () {
    it('Should withdraw funds from the contract to domain owner', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const childDomain2 = 'test2';
      const priceEth =
        await domainRegistry.getRegistrationPriceInEth();
      const priceUsdc =
        await domainRegistry.getRegistrationPriceInUsdc();
      await usdcToken.transfer(addr1, priceUsdc);

      await domainRegistry.buyDomainViaEth(domain, {
        value: priceEth,
      });
      await domainRegistry
        .connect(addr1)
        .buyChildDomainViaEth(domain, childDomain, {
          value: priceEth,
        });

      await usdcToken
        .connect(addr1)
        .approve(domainRegistry.target, priceUsdc);
      await domainRegistry
        .connect(addr1)
        .buyChildDomainViaUsdc(domain, childDomain2);

      const initialContractBalanceEth =
        await ethers.provider.getBalance(domainRegistry.getAddress());
      const initialContractBalanceUsdc = await usdcToken.balanceOf(
        domainRegistry.target
      );

      expect(initialContractBalanceEth).to.equal(
        priceEth * BigInt(2)
      );
      expect(initialContractBalanceUsdc).to.equal(priceUsdc);

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const withdrawDomainEthTx =
        await domainRegistry.withdrawDomainEth();

      const contractBalanceEth = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(contractBalanceEth).to.equal(priceEth);

      expect(withdrawDomainEthTx).to.changeEtherBalance(
        owner,
        priceEth
      );

      expect(withdrawDomainEthTx)
        .to.emit(domainRegistry, 'Withdrawal')
        .withArgs(priceEth, blockTimestamp);

      const finalContractBalanceEth =
        await ethers.provider.getBalance(domainRegistry.getAddress());

      expect(finalContractBalanceEth).to.equal(priceEth);

      const block2 = await ethers.provider.getBlock();
      const blockTimestamp2 = block2.timestamp;

      const withdrawDomainUsdcTx =
        await domainRegistry.withdrawDomainUsdc();

      expect(withdrawDomainUsdcTx)
        .to.emit(domainRegistry, 'Withdrawal')
        .withArgs(priceUsdc, blockTimestamp2);
    });

    it('Should revert if domain owner funds balance is zero', async function () {
      await expect(domainRegistry.connect(addr1).withdrawDomainEth())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'NothingToWithdraw'
        )
        .withArgs(addr1);

      await expect(domainRegistry.connect(addr1).withdrawDomainUsdc())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'NothingToWithdraw'
        )
        .withArgs(addr1);
    });
  });

  describe('buyChildDomain', async function () {
    it('Should buy child domain', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const childDomain2 = 'test2';
      const expectedResult = 'test.com';
      const expectedResult2 = 'test.com';
      const priceEth =
        await domainRegistry.getRegistrationPriceInEth();
      const priceUsdc =
        await domainRegistry.getRegistrationPriceInUsdc();

      await domainRegistry.buyDomainViaEth(domain, {
        value: priceEth,
      });

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const buyChildDomainTransaction =
        await domainRegistry.buyChildDomainViaEth(
          domain,
          childDomain,
          {
            value: priceEth,
          }
        );

      expect(
        await domainRegistry.getDomainOwner(expectedResult)
      ).to.be.equal(owner);

      expect(buyChildDomainTransaction)
        .to.emit(domainRegistry, 'DomainRegistered')
        .withArgs(domain, owner, blockTimestamp);

      await usdcToken.approve(domainRegistry.target, priceUsdc);

      const block2 = await ethers.provider.getBlock();
      const blockTimestamp2 = block2.timestamp;

      const buyChildDomainUsdcTransaction =
        await domainRegistry.buyChildDomainViaUsdc(
          domain,
          childDomain2,
          {
            value: priceUsdc,
          }
        );

      expect(
        await domainRegistry.getDomainOwner(expectedResult2)
      ).to.be.equal(owner);

      expect(buyChildDomainUsdcTransaction)
        .to.emit(domainRegistry, 'DomainRegistered')
        .withArgs(domain, owner, blockTimestamp2);
    });

    it('Should revert if child domain already taken', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const price = await domainRegistry.getRegistrationPriceInEth();
      const priceUsdc =
        await domainRegistry.getRegistrationPriceInUsdc();

      await domainRegistry.buyDomainViaEth(domain, { value: price });
      await domainRegistry.buyChildDomainViaEth(domain, childDomain, {
        value: price,
      });

      await expect(
        domainRegistry.buyChildDomainViaEth(domain, childDomain, {
          value: price,
        })
      ).to.be.revertedWithCustomError(
        domainRegistry,
        'DomainAlreadyTaken'
      );
      await usdcToken.approve(domainRegistry.target, priceUsdc);
      await expect(
        domainRegistry.buyChildDomainViaUsdc(domain, childDomain)
      ).to.be.revertedWithCustomError(
        domainRegistry,
        'DomainAlreadyTaken'
      );
    });

    it('Should revert if value sent is incorrect', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const price = await domainRegistry.getRegistrationPriceInEth();
      const incorrectValue = price / BigInt(2);

      await domainRegistry.buyDomainViaEth(domain, { value: price });

      await expect(
        domainRegistry.buyChildDomainViaEth(domain, childDomain, {
          value: incorrectValue,
        })
      )
        .to.be.revertedWithCustomError(
          domainRegistry,
          'IncorrectValueAmount'
        )
        .withArgs(incorrectValue, price);
    });

    it('Should revert if parent domain doesn`t exist', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const price = await domainRegistry.getRegistrationPriceInEth();
      const wrongDomain = 'org';

      await domainRegistry.buyDomainViaEth(domain, { value: price });

      await expect(
        domainRegistry.buyChildDomainViaEth(
          wrongDomain,
          childDomain,
          {
            value: price,
          }
        )
      )
        .to.be.revertedWithCustomError(
          domainRegistry,
          'ParentDomainNotFound'
        )
        .withArgs(wrongDomain);
    });
  });

  describe('DomainRegistered metrics', async function () {
    it('Should show correct amount of registered domains', async function () {
      const expectedAmountOfEvents = 4;
      const firstDomain = 'com';
      const secondDomain = 'net';
      const thirdDomain = 'org';
      const fourthDomain = 'io';

      const price = await domainRegistry.getRegistrationPriceInEth();

      await domainRegistry.buyDomainViaEth(firstDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(secondDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(thirdDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(fourthDomain, {
        value: price,
      });

      const filter = domainRegistry.filters.DomainRegistered();

      const logs = await domainRegistry.queryFilter(filter);

      expect(logs.length).to.equal(expectedAmountOfEvents);
    });

    it('Should show list of registered domains sorted by registeredDate', async function () {
      const firstDomain = 'com';
      const secondDomain = 'net';
      const thirdDomain = 'org';
      const fourthDomain = 'io';

      const price = await domainRegistry.getRegistrationPriceInEth();

      await domainRegistry.buyDomainViaEth(firstDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(secondDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(thirdDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(fourthDomain, {
        value: price,
      });

      const filter = domainRegistry.filters.DomainRegistered();

      const logs = await domainRegistry.queryFilter(filter);

      logs.sort(
        (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
      );

      logs.forEach((currentLog, index) => {
        const nextLog = logs[index + 1];

        if (nextLog) {
          expect(currentLog.args[1]).to.equal(nextLog.args[1]); //arg[1] is controller
          expect(currentLog.blockNumber).to.be.at.most(
            nextLog.blockNumber
          );
        }
      });
    });

    it('Should show list of registered domains sorted by blockNumber and filtered by controller', async function () {
      const firstDomain = 'com';
      const secondDomain = 'net';
      const thirdDomain = 'org';
      const fourthDomain = 'io';

      const price = await domainRegistry.getRegistrationPriceInEth();

      await domainRegistry.buyDomainViaEth(firstDomain, {
        value: price,
      });
      await domainRegistry
        .connect(addr1)
        .buyDomainViaEth(secondDomain, {
          value: price,
        });
      await domainRegistry.buyDomainViaEth(thirdDomain, {
        value: price,
      });
      await domainRegistry.buyDomainViaEth(fourthDomain, {
        value: price,
      });

      const filter = domainRegistry.filters.DomainRegistered(
        null,
        addr1.address
      );

      const logs = await domainRegistry.queryFilter(filter);

      logs.sort(
        (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
      );

      logs.forEach((currentLog, index) => {
        const nextLog = logs[index + 1];

        if (nextLog) {
          expect(currentLog.args[1]).to.equal(nextLog.args[1]); //arg[1] is controller
          expect(currentLog.blockNumber).to.be.at.most(
            nextLog.blockNumber
          );
        }
      });
    });
  });
});
