'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArticleSubmitRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/submit?tab=article');
  }, [router]);
  return null;
}
