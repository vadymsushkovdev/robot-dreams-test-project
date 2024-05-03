import { useEffect, useState } from "react";

interface Props {
  isAuthenticated: boolean;
  contract: any;
  address: string;
  triggerDomains: boolean;
}

interface Domain {
  domain: string;
  blockNumber: number;
}

export const UserDomains = ({
  isAuthenticated,
  contract,
  address,
  triggerDomains,
}: Props) => {
  const [myDomains, setMyDomains] = useState<Domain[]>([]);

  useEffect(() => {
    if (address && contract) {
      (async () => {
        const filter = contract.filters.DomainRegistered(null, address);

        const logs: any = await contract.queryFilter(filter);

        let array = [];

        for (let i = 0; i < logs.length; i++) {
          array.push(i);
        }

        const mapedArr = array.map((item) => {
          return {
            domain: logs[item].args[0],
            blockNumber: logs[item].blockNumber,
          };
        });

        setMyDomains(mapedArr);
      })();
    }
  }, [address, contract, triggerDomains]);

  return (
    myDomains.length >= 0 &&
    isAuthenticated && (
      <div style={{ marginTop: "50px" }}>
        <h2>My domains:</h2>
        {myDomains.map(({ domain, blockNumber }) => (
          <div
            key={domain}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p>{domain}</p>
            <p>{blockNumber}</p>
          </div>
        ))}
      </div>
    )
  );
};
