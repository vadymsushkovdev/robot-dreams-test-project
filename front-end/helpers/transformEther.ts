import { ethers } from "ethers";

export const transformEther = (price: any) => ethers.formatEther(price);
