import { useState } from 'react';
import { splitStringByFirstDot } from '@/helpers/splitStringByFirstDot';

export const useDomains = () => {
  const [child, setChild] = useState<string>('');
  const [parent, setParent] = useState<string>('');

  const onSetDomains = async (domain: string) => {
    if (domain) {
      try {
        const [child, parent] = splitStringByFirstDot(domain);
        setChild(child);
        setParent(parent);
      } catch (e) {
        console.log(e);
      }
    }
  };

  return { child, parent, onSetDomains };
};
