'use client';

import { use } from 'react';
import ResourceForm from '../../ResourceForm';

export default function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResourceForm mode="edit" resourceId={Number(id)} />;
}
