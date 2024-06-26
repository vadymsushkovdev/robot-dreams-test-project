const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const {
  takeSnapshot,
} = require('@nomicfoundation/hardhat-network-helpers');

describe('DomainRegistry', function () {
  let snapshotA;
  let DomainRegistry;
  let domainRegistry;
  let owner;
  let addr1;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    const price = ethers.parseEther('0.1');

    DomainRegistry =
      await ethers.getContractFactory('DomainRegistry');
    domainRegistry = await upgrades.deployProxy(DomainRegistry, [
      price,
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
      const newPrice = ethers.parseEther('0.2');

      const changePriceTx =
        await domainRegistry.changePrice(newPrice);

      expect(
        await domainRegistry.getDomainRegistrationPrice()
      ).to.equal(newPrice);

      expect(changePriceTx)
        .to.emit(domainRegistry, 'PriceChanged')
        .withArgs(newPrice);
    });

    it('Should revert if called by non-owner', async function () {
      const price = ethers.parseEther('0.1');

      await expect(domainRegistry.connect(addr1).changePrice(price))
        .to.be.revertedWithCustomError(
          domainRegistry,
          'OwnableUnauthorizedAccount'
        )
        .withArgs(addr1);
    });
  });

  describe('buyDomain', function () {
    it('Should buy a domain successfully', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      const buyDomainTransaction = await domainRegistry.buyDomain(
        domain,
        { value: price }
      );
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

    it('Should revert if domain already taken', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');
      await domainRegistry.buyDomain(domain, { value: price });

      await expect(
        domainRegistry.buyDomain(domain, {
          value: price,
        })
      ).to.be.revertedWithCustomError(
        domainRegistry,
        'DomainAlreadyTaken'
      );
    });

    it('Should revert if value sent is incorrect', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');
      const wrongValue = price / BigInt(2);

      await expect(
        domainRegistry.buyDomain(domain, {
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
    it('Should withdraw funds from the contract', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(domain, {
        value: price,
      });

      const initialContractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(initialContractBalance).to.equal(price);

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const withdrawTx = await domainRegistry.withdraw();

      const contractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(contractBalance).to.equal(BigInt(0));

      expect(withdrawTx).to.changeEtherBalance(owner, price);

      expect(withdrawTx)
        .to.emit(domainRegistry, 'Withdrawal')
        .withArgs(price, blockTimestamp);
    });

    it('Should revert if contract balance is zero', async function () {
      await expect(domainRegistry.connect(owner).withdraw())
        .to.be.revertedWithCustomError(
          domainRegistry,
          'NothingToWithdraw'
        )
        .withArgs(owner);
    });

    it('Should revert if called by non-owner', async function () {
      await expect(domainRegistry.connect(addr1).withdraw())
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
      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(domain, {
        value: price,
      });

      await domainRegistry
        .connect(addr1)
        .buyChildDomain(domain, childDomain, {
          value: price,
        });

      const initialContractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(initialContractBalance).to.equal(price * BigInt(2));

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const withdrawDomainTx = await domainRegistry.withdrawDomain();

      const contractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(contractBalance).to.equal(price);

      expect(withdrawDomainTx).to.changeEtherBalance(owner, price);

      expect(withdrawDomainTx)
        .to.emit(domainRegistry, 'Withdrawal')
        .withArgs(price, blockTimestamp);

      const finalContractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(finalContractBalance).to.equal(price);
    });

    it('Should revert if domain owner funds balance is zero', async function () {
      await expect(domainRegistry.connect(addr1).withdrawDomain())
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
      const expectedResult = 'test.com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(domain, {
        value: price,
      });

      const block = await ethers.provider.getBlock();
      const blockTimestamp = block.timestamp;

      const buyChildDomainTransaction =
        await domainRegistry.buyChildDomain(domain, childDomain, {
          value: price,
        });

      expect(
        await domainRegistry.getDomainOwner(expectedResult)
      ).to.be.equal(owner);

      expect(buyChildDomainTransaction)
        .to.emit(domainRegistry, 'DomainRegistered')
        .withArgs(domain, owner, blockTimestamp);
    });

    it('Should revert if child domain already taken', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(domain, { value: price });
      await domainRegistry.buyChildDomain(domain, childDomain, {
        value: price,
      });

      await expect(
        domainRegistry.buyChildDomain(domain, childDomain, {
          value: price,
        })
      ).to.be.revertedWithCustomError(
        domainRegistry,
        'DomainAlreadyTaken'
      );
    });

    it('Should revert if value sent is incorrect', async function () {
      const domain = 'com';
      const childDomain = 'test';
      const price = ethers.parseEther('0.1');
      const incorrectValue = price / BigInt(2);

      await domainRegistry.buyDomain(domain, { value: price });

      await expect(
        domainRegistry.buyChildDomain(domain, childDomain, {
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
      const price = ethers.parseEther('0.1');
      const wrongDomain = 'org';

      await domainRegistry.buyDomain(domain, { value: price });

      await expect(
        domainRegistry.buyChildDomain(wrongDomain, childDomain, {
          value: price,
        })
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

      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(firstDomain, { value: price });
      await domainRegistry.buyDomain(secondDomain, {
        value: price,
      });
      await domainRegistry.buyDomain(thirdDomain, {
        value: price,
      });
      await domainRegistry.buyDomain(fourthDomain, {
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

      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(firstDomain, { value: price });
      await domainRegistry.buyDomain(secondDomain, {
        value: price,
      });
      await domainRegistry.buyDomain(thirdDomain, {
        value: price,
      });
      await domainRegistry.buyDomain(fourthDomain, {
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

      const price = ethers.parseEther('0.1');

      await domainRegistry.buyDomain(firstDomain, { value: price });
      await domainRegistry.connect(addr1).buyDomain(secondDomain, {
        value: price,
      });
      await domainRegistry.buyDomain(thirdDomain, {
        value: price,
      });
      await domainRegistry.buyDomain(fourthDomain, {
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
