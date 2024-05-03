'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, ethers, JsonRpcSigner } from 'ethers';
import Image from 'next/image';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import { DomainRegistry } from '@/const/const';
import { useEth } from '@/hooks/useEthHook';
import { useUsdc } from '@/hooks/useUsdc';
import { useDomains } from '@/hooks/useDomains';
import { UserFunds } from '@/components/UserFunds';
import { transformEther } from '@/helpers/transformEther';
import { transformUsdc } from '@/helpers/transformUsdc';
import { UserDomains } from '@/components/UserDomains';
import { DomainsSearch } from '@/components/DomainsSearch';

const initialWeb3State = {
  address: null,
  currentChain: null,
  signer: null,
  provider: null,
  isAuthenticated: false,
};

declare global {
  interface Window {
    ethereum: any;
  }
}

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as string;

interface IWeb3State {
  address: string | null;
  currentChain: number | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isAuthenticated: boolean;
}

export default function Home() {
  const [value, setValue] = useState<string>('');
  const [contract, setContract] = useState<any>(null);
  const [isCanBuyDomain, setIsCanBuyDomain] =
    useState<boolean>(false);
  const [priceEth, setPriceEth] = useState<string>('');
  const [priceUsdc, setPriceUsdc] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [triggerDomains, setTriggerDomains] =
    useState<boolean>(false);

  const [state, setState] = useState<IWeb3State>(initialWeb3State);
  const { onSetDomains, parent, child } = useDomains();
  const { onBuy } = useEth({
    contract,
    domain: value,
    provider: state.provider,
    setTriggerDomains,
    parent,
    child,
  });
  const { onBuyUsdc } = useUsdc({
    signer: state.signer,
    contract,
    domain: value,
    provider: state.provider,
    setTriggerDomains,
    parent,
    child,
  });

  const connectWallet = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        return alert('No ethereum wallet found');
      }
      const provider = new ethers.BrowserProvider(ethereum);

      const accounts: string[] = await provider.send(
        'eth_requestAccounts',
        []
      );

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const chain = Number(
          await (
            await provider.getNetwork()
          ).chainId
        );

        setState({
          ...state,
          address: accounts[0],
          signer,
          currentChain: chain,
          provider,
          isAuthenticated: true,
        });

        localStorage.setItem('isAuthenticated', 'true');
      }
    } catch (error) {
      console.log(error);
    }
  }, [state]);

  useEffect(() => {
    if (state.signer) {
      setContract(
        new ethers.Contract(
          CONTRACT_ADDRESS,
          DomainRegistry.abi,
          state.signer
        )
      );
    }
  }, [state]);

  const getPrice = async () => {
    if (contract) {
      try {
        const priceUSDC = await contract.getRegistrationPriceInUsdc();
        const priceETH = await contract.getRegistrationPriceInEth();

        setPriceEth(transformEther(priceETH));
        setPriceUsdc(priceUSDC.toString());
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await onSetDomains(value);
    await getPrice();
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'whitesmoke',
          color: 'black',
        }}
      >
        {state.isAuthenticated && (
          <UserFunds
            contract={contract}
            address={state.address as string}
          />
        )}

        {!state.isAuthenticated && (
          <Button
            type="button"
            onClick={connectWallet}
            sx={{
              marginTop: '100px',
            }}
          >
            Connect wallet
          </Button>
        )}
        <DomainsSearch
          contract={contract}
          setValue={setValue}
          setIsCanBuyDomain={setIsCanBuyDomain}
          isAuthenticated={state.isAuthenticated}
          value={value}
        />

        {isCanBuyDomain && (
          <Button type="button" onClick={handleOpen}>
            Buy now
          </Button>
        )}
        <UserDomains
          contract={contract}
          address={state.address as string}
          isAuthenticated={state.isAuthenticated}
          triggerDomains={triggerDomains}
        />
      </main>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <Box sx={{ padding: '20px' }}>
          <DialogTitle id="alert-dialog-title" fontSize="30px">
            Choose your blockchain
          </DialogTitle>

          <DialogActions
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <Button
              sx={{ display: 'flex', gap: '10px', fontSize: '20px' }}
              onClick={onBuyUsdc}
            >
              <Image
                alt="bitcoin icon"
                width={25}
                height={25}
                src="/images/usd-coin-usdc-logo.svg"
              />
              {priceUsdc && <p>{transformUsdc(priceUsdc)}</p>}
            </Button>

            <Button
              type="button"
              sx={{ display: 'flex', gap: '10px', fontSize: '20px' }}
              onClick={onBuy}
            >
              <Image
                alt="bitcoin icon"
                width={25}
                height={25}
                src="/images/ethereum-colored.svg"
              />
              {priceEth && <p>{priceEth}</p>}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
