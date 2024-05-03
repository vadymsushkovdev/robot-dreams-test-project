export const splitStringByFirstDot = (inputString: string) => {
  const dotIndex = inputString.indexOf(".");

  if (dotIndex !== -1) {
    const firstPart = inputString.substring(0, dotIndex);
    const secondPart = inputString.substring(dotIndex + 1);

    return [firstPart, secondPart];
  } else {
    return [inputString];
  }
};
