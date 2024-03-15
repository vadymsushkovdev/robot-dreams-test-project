const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('DomainRegistry', function () {
  let DomainRegistry;
  let domainRegistry;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    DomainRegistry =
      await ethers.getContractFactory('DomainRegistry');
    domainRegistry = await DomainRegistry.deploy();
    await domainRegistry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the owner correctly', async function () {
      expect(await domainRegistry.owner()).to.equal(owner.address);
    });
  });

  describe('addNewDomain', function () {
    it('Should add a new domain with its price', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.addNewDomain(domain, price);

      expect(await domainRegistry.domainPrices(domain)).to.equal(
        price
      );
    });

    it('Should revert if domain already exists', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.addNewDomain(domain, price);

      await expect(
        domainRegistry.addNewDomain(domain, price)
      ).to.be.revertedWith('Domain Already Exists');
    });

    it('Should revert if called by non-owner', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await expect(
        domainRegistry.connect(addr1).addNewDomain(domain, price)
      ).to.be.revertedWith('Forbidden Resource');
    });
  });

  describe('changePrice', function () {
    it('Should change the price of an existing domain', async function () {
      const domain = 'com';
      const initialPrice = ethers.parseEther('0.1');
      const newPrice = ethers.parseEther('0.2');

      await domainRegistry.addNewDomain(domain, initialPrice);
      await domainRegistry.changePrice(domain, newPrice);

      expect(await domainRegistry.domainPrices(domain)).to.equal(
        newPrice
      );
    });

    it('Should revert if domain does not exist', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await expect(
        domainRegistry.changePrice(domain, price)
      ).to.be.revertedWith('Domain Does Not Exists');
    });

    it('Should revert if called by non-owner', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await expect(
        domainRegistry.connect(addr1).changePrice(domain, price)
      ).to.be.revertedWith('Forbidden Resource');
    });
  });

  describe('buyDomain', function () {
    it('Should buy a domain successfully', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.addNewDomain(domain, price);

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

      await domainRegistry.addNewDomain(domain, price);
      await domainRegistry.buyDomain(domain, { value: price });

      await expect(
        domainRegistry.buyDomain(domain, {
          value: price,
        })
      ).to.be.revertedWith('Domain Already Taken');
    });

    it('Should revert if value sent is incorrect', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.addNewDomain(domain, price);

      await expect(
        domainRegistry.buyDomain(domain, {
          value: price / BigInt(2),
        })
      ).to.be.revertedWith('Incorrect Value Amount');
    });

    it('Should revert if domain does not exist', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await expect(
        domainRegistry.buyDomain(domain, { value: price })
      ).to.be.revertedWith('Domain Does Not Exists');
    });
  });

  describe('withdraw', function () {
    it('Should withdraw funds from the contract', async function () {
      const domain = 'com';
      const price = ethers.parseEther('0.1');

      await domainRegistry.addNewDomain(domain, price);
      await domainRegistry.buyDomain(domain, {
        value: price,
      });

      const initialContractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(initialContractBalance).to.equal(price);

      const withdrawTx = await domainRegistry.withdraw();

      const contractBalance = await ethers.provider.getBalance(
        domainRegistry.getAddress()
      );

      expect(contractBalance).to.equal(BigInt(0));

      expect(withdrawTx).to.changeEtherBalance(owner, price);
    });

    it('Should revert if contract balance is zero', async function () {
      await expect(
        domainRegistry.connect(owner).withdraw()
      ).to.be.revertedWith('Nothing To Withdraw');
    });

    it('Should revert if called by non-owner', async function () {
      await expect(
        domainRegistry.connect(addr1).withdraw()
      ).to.be.revertedWith('Forbidden Resource');
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

      await domainRegistry.addNewDomain(firstDomain, price);
      await domainRegistry.addNewDomain(secondDomain, price * 2n);
      await domainRegistry.addNewDomain(thirdDomain, price * 3n);
      await domainRegistry.addNewDomain(fourthDomain, price * 4n);

      await domainRegistry.buyDomain(firstDomain, { value: price });
      await domainRegistry.buyDomain(secondDomain, {
        value: price * 2n,
      });
      await domainRegistry.buyDomain(thirdDomain, {
        value: price * 3n,
      });
      await domainRegistry.buyDomain(fourthDomain, {
        value: price * 4n,
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

      await domainRegistry.addNewDomain(firstDomain, price);
      await domainRegistry.addNewDomain(secondDomain, price * 2n);
      await domainRegistry.addNewDomain(thirdDomain, price * 3n);
      await domainRegistry.addNewDomain(fourthDomain, price * 4n);

      await domainRegistry.buyDomain(firstDomain, { value: price });
      await domainRegistry.buyDomain(secondDomain, {
        value: price * 2n,
      });
      await domainRegistry.buyDomain(thirdDomain, {
        value: price * 3n,
      });
      await domainRegistry.buyDomain(fourthDomain, {
        value: price * 4n,
      });

      const filter = domainRegistry.filters.DomainRegistered();

      const logs = await domainRegistry.queryFilter(filter);

      logs.sort(
        (a, b) =>
          Number(a.args.registrationTimeStamp) -
          Number(b.args.registrationTimeStamp)
      );

      logs.forEach((currentLog, index) => {
        const nextLog = logs[index + 1];

        if (nextLog) {
          expect(currentLog.args[2]).to.be.at.most(nextLog.args[2]); //arg[2] is registrationTimeStamp
        }
      });
    });

    it('Should show list of registered domains sorted by registeredDate and filtered by controller', async function () {
      const firstDomain = 'com';
      const secondDomain = 'net';
      const thirdDomain = 'org';
      const fourthDomain = 'io';

      const price = ethers.parseEther('0.1');

      await domainRegistry.addNewDomain(firstDomain, price);
      await domainRegistry.addNewDomain(secondDomain, price * 2n);
      await domainRegistry.addNewDomain(thirdDomain, price * 3n);
      await domainRegistry.addNewDomain(fourthDomain, price * 4n);

      await domainRegistry.buyDomain(firstDomain, { value: price });
      await domainRegistry.connect(addr1).buyDomain(secondDomain, {
        value: price * 2n,
      });
      await domainRegistry.buyDomain(thirdDomain, {
        value: price * 3n,
      });
      await domainRegistry.buyDomain(fourthDomain, {
        value: price * 4n,
      });

      const filter = domainRegistry.filters.DomainRegistered(
        null,
        addr1.address
      );

      const logs = await domainRegistry.queryFilter(filter);

      logs.sort(
        (a, b) =>
          Number(a.args.registrationTimeStamp) -
          Number(b.args.registrationTimeStamp)
      );

      logs.forEach((currentLog, index) => {
        const nextLog = logs[index + 1];

        if (nextLog) {
          expect(currentLog.args[1]).to.equal(nextLog.args[1]); //arg[1] is controller
          expect(currentLog.args[2]).to.be.at.most(nextLog.args[2]); //arg[2] is registrationTimeStamp
        }
      });
    });
  });
});
