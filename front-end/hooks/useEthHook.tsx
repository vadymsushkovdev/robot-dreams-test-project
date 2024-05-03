import { Dispatch, SetStateAction } from 'react';
import { useDomains } from '@/hooks/useDomains';

export const useEth = ({
  contract,
  domain,
  provider,
  setTriggerDomains,
  parent,
  child,
}: {
  contract: any;
  domain: string;
  provider: any;
  setTriggerDomains: Dispatch<SetStateAction<boolean>>;
  parent: string;
  child: string;
}) => {
  const onBuyChild = async () => {
    const price = await contract.getRegistrationPriceInEth();

    try {
      console.log({ parent, child });
      const buyChildDomainTransaction =
        await contract.buyChildDomainViaEth(parent, child, {
          value: price,
        });
      await buyChildDomainTransaction.wait();
    } catch (error) {
      console.log(error);
    } finally {
      setTriggerDomains((prevState) => !prevState);
    }
  };

  const onBuyParent = async () => {
    console.log('onBuyParent');
    const signer = await provider.getSigner();
    const price = await contract.getRegistrationPriceInEth();

    try {
      const buyDomainTransaction = await contract
        .connect(signer)
        .buyDomainViaEth(domain, {
          value: price,
        });
      await buyDomainTransaction.wait();
    } catch (error) {
      console.log(error);
    } finally {
      setTriggerDomains((prevState) => !prevState);
    }
  };

  return { onBuy: child && parent ? onBuyChild : onBuyParent };
};
