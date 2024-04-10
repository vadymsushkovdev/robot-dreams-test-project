const {
  takeSnapshot,
} = require('@nomicfoundation/hardhat-network-helpers');
const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

describe('DomainRegistry upgrade v1', async function () {
  let snapshotA;
  let domainRegistry;
  let owner;
  let addr1;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    const _domainRegistryV1 = await ethers.getContractFactory(
      'DomainRegistryV1'
    );
    const price = ethers.parseEther('0.1');

    domainRegistry = await upgrades.deployProxy(_domainRegistryV1, [
      price,
    ]);

    await domainRegistry.waitForDeployment();

    snapshotA = await takeSnapshot();
  });

  afterEach(async () => await snapshotA.restore());

  it('Should contains the same owner', async function () {
    const ownerV1 = await domainRegistry.owner();

    const domainRegistryV2 =
      await ethers.getContractFactory('DomainRegistry');
    const domainRegistryV2Contract = await upgrades.upgradeProxy(
      domainRegistry.target,
      domainRegistryV2
    );

    const ownerV2 = await domainRegistryV2Contract.owner();

    expect(ownerV1).to.be.equal(ownerV2);
  });

  it('Should contains the same registrationPrice', async function () {
    const registrationPriceV1 =
      await domainRegistry.registrationPrice();

    const domainRegistryV2 =
      await ethers.getContractFactory('DomainRegistry');
    const domainRegistryV2Contract = await upgrades.upgradeProxy(
      domainRegistry.target,
      domainRegistryV2
    );

    const registrationPriceV2 =
      await domainRegistryV2Contract.registrationPrice();

    expect(registrationPriceV1).to.be.equal(registrationPriceV2);
  });

  it('Should contains the same domainList', async function () {
    const firstDomain = 'com';
    const secondDomain = 'net';
    const thirdDomain = 'org';
    const fourthDomain = 'io';

    const price = ethers.parseEther('0.1');

    await domainRegistry.buyDomain(firstDomain, { value: price });
    await domainRegistry.buyDomain(secondDomain, {
      value: price,
    });
    await domainRegistry.connect(addr1).buyDomain(thirdDomain, {
      value: price,
    });
    await domainRegistry.connect(addr1).buyDomain(fourthDomain, {
      value: price,
    });

    const domainRegistryV2 =
      await ethers.getContractFactory('DomainRegistry');
    const domainRegistryV2Contract = await upgrades.upgradeProxy(
      domainRegistry.target,
      domainRegistryV2
    );

    expect(
      await domainRegistryV2Contract.domainList(firstDomain)
    ).to.be.equal(owner);
    expect(
      await domainRegistryV2Contract.domainList(secondDomain)
    ).to.be.equal(owner);
    expect(
      await domainRegistryV2Contract.domainList(thirdDomain)
    ).to.be.equal(addr1);
    expect(
      await domainRegistryV2Contract.domainList(fourthDomain)
    ).to.be.equal(addr1);
  });
});
