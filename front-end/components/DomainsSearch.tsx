import { Dispatch, SetStateAction, useState } from "react";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import { splitStringByFirstDot } from "@/helpers/splitStringByFirstDot";
import { validateAddress } from "@/helpers/validateAddress";

interface Props {
  setValue: Dispatch<SetStateAction<string>>;
  setIsCanBuyDomain: Dispatch<SetStateAction<boolean>>;
  value: string;
  contract: any;
  isAuthenticated: boolean;
}

export const DomainsSearch = ({
  setValue,
  value,
  contract,
  setIsCanBuyDomain,
  isAuthenticated,
}: Props) => {
  const [domainMessage, setDomainMessage] = useState<string>("");

  const handleInputChange = (event: any) => {
    setValue(event.target.value);
  };
  const handleSearchDomain = async (event: any) => {
    event.preventDefault();

    if (value) {
      try {
        const [, parent] = splitStringByFirstDot(value);

        if (parent) {
          const isExistingParentDomain = validateAddress(
            await contract.getDomainOwner(parent),
          );

          if (!isExistingParentDomain) {
            setDomainMessage(`This  ${parent} domain is not existing`);
            setIsCanBuyDomain(false);
            return;
          }
        }

        const domainOwner = await contract.getDomainOwner(value);

        const isNotAvailableDomain = validateAddress(domainOwner);
        if (isNotAvailableDomain) {
          setDomainMessage(
            `This  ${value} domain is already taken by ${domainOwner}`,
          );
          setIsCanBuyDomain(false);
          return;
        }

        setIsCanBuyDomain(true);
        setDomainMessage(`This  ${value} domain is available`);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    isAuthenticated && (
      <>
        <Paper
          component="form"
          onSubmit={handleSearchDomain}
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: 400,
            marginTop: "50px",
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search Blockchain"
            onChange={handleInputChange}
            value={value}
          />
          <IconButton
            type="submit"
            sx={{ p: "10px" }}
            aria-label="search"
            disabled={!value}
          >
            <SearchIcon />
          </IconButton>
        </Paper>
        {domainMessage && <p style={{ color: "black" }}>{domainMessage}</p>}
      </>
    )
  );
};
