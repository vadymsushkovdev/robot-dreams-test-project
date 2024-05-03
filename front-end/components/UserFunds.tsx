'use client';

import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import { transformEther } from '@/helpers/transformEther';
import { transformUsdc } from '@/helpers/transformUsdc';

interface Props {
  contract: any;
  address: string;
}

interface Funds {
  usdc: number;
  eth: string;
}

export const UserFunds = ({ contract, address }: Props) => {
  const [funds, setFunds] = useState<Funds>({} as Funds);
  const [yourFunds, setYourFunds] = useState<Funds>({} as Funds);
  const [searchedAddress, setSearchedAddress] = useState<string>('');
  const [triggerFundsRequest, setTriggerFundsRequest] =
    useState<boolean>(false);

  useEffect(() => {
    if (contract && address) {
      (async () => {
        try {
          const response = await contract.getControllerFunds(address);
          console.log(response.usdcFunds);
          setYourFunds({
            usdc: transformUsdc(response.usdcFunds),
            eth: transformEther(response.ethFunds),
          });
        } catch (error) {
          console.log(error);
        }
      })();
    }
  }, [contract, address, triggerFundsRequest]);

  const onSearchFunds = async (event: any) => {
    event.preventDefault();

    try {
      const response =
        await contract.getControllerFunds(searchedAddress);
      setFunds({
        usdc: transformUsdc(response.usdcFunds),
        eth: transformEther(response.ethFunds),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const onChange = (event: any) => {
    setSearchedAddress(event.target.value);
  };

  const onWithdrawEth = async () => {
    if (yourFunds.eth) {
      try {
        const response = await contract.withdrawDomainEth();
        await response.wait();
      } catch (error) {
        console.log(error);
      } finally {
        setTriggerFundsRequest((prevState) => !prevState);
      }
    }
  };
  const onWithdrawUsdc = async () => {
    if (yourFunds.usdc) {
      try {
        const response = await contract.withdrawDomainUsdc();
        await response.wait();
      } catch (error) {
        console.log(error);
      } finally {
        setTriggerFundsRequest((prevState) => !prevState);
      }
    }
  };

  return (
    <div>
      <Paper
        component="form"
        onSubmit={onSearchFunds}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: 400,
          margin: '150px 0 20px 0',
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search funds"
          value={searchedAddress}
          onChange={onChange}
        />
        <IconButton
          type="submit"
          sx={{ p: '10px' }}
          aria-label="search"
          disabled={!searchedAddress}
        >
          <SearchIcon />
        </IconButton>
      </Paper>

      <div style={{ display: 'flex' }}>ETH: {funds.eth}</div>
      <div>USDC: {funds.usdc}</div>

      <h2 style={{ marginTop: '30px' }}>Your Funds</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        ETH: {yourFunds.eth}
        {Number(yourFunds.eth) > 0 && (
          <Button type="button" onClick={onWithdrawEth}>
            Withdraw ETH
          </Button>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        USDC: {yourFunds.usdc}
        {yourFunds.usdc && (
          <Button type="button" onClick={onWithdrawUsdc}>
            Withdraw USDC
          </Button>
        )}
      </div>
    </div>
  );
};
