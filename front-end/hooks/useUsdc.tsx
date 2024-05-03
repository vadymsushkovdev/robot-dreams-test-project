import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { USDC_ABI } from '@/const/const';
import { useDomains } from '@/hooks/useDomains';

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as string;

export const useUsdc = ({
  signer,
  contract,
  domain,
  provider,
  setTriggerDomains,
  parent,
  child,
}: {
  provider: any;
  signer: any;
  contract: any;
  domain: string;
  setTriggerDomains: Dispatch<SetStateAction<boolean>>;
  parent: string;
  child: string;
}) => {
  const [usdcContract, setUsdcContract] = useState<any>(null);

  useEffect(() => {
    if (signer) {
      setUsdcContract(
        new ethers.Contract(CONTRACT_ADDRESS, USDC_ABI.abi, signer)
      );
    }
  }, [signer]);

  const onApprovePrice = async () => {
    const price = contract.getRegistrationPriceInUsdc();

    try {
      if (price) {
        const response = await usdcContract.approve(
          contract.target,
          price
        );
        await response.wait();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTriggerDomains((prevState) => !prevState);
    }
  };

  const onBuyChild = async () => {
    console.log('onBuyChild');
    const price = contract.getRegistrationPriceInUsdc();

    console.log(1);
    await onApprovePrice();
    console.log(2);
    try {
      console.log({ parent, child });
      const response = await contract.buyChildDomainViaUsdc(
        parent,
        child
      );
      await response.wait();
      console.log(3);
    } catch (e) {
      console.log(e);
    }
  };

  const onBuyParent = async () => {
    console.log('onBuyParent');
    const signer = await provider.getSigner();
    const price = await contract.getRegistrationPriceInUsdc();

    await onApprovePrice();

    try {
      const buyDomainTransaction = await contract
        .connect(signer)
        .buyDomainViaUsdc(domain, {
          value: price,
        });
      await buyDomainTransaction.wait();
    } catch (error: any) {
      console.dir(error);
      alert('Influence money');
    }
  };

  return { onBuyUsdc: child && parent ? onBuyChild : onBuyParent };
};
