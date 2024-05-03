export const validateAddress = (address: string) => {
  return !/^0x[0]{40}$/.test(address);
};
