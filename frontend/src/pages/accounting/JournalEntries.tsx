import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GeneralJournalEntryModal from '../../components/accounting/GeneralJournalEntryModal';

export default function JournalEntries() {
  const navigate = useNavigate();
  const [selectedEntryId] = useState<string | null>(null);

  return (
    <GeneralJournalEntryModal
      isOpen={true}
      fullPage={true}
      onClose={() => navigate('/accounting')}
      entryId={selectedEntryId}
      onSuccess={() => {}}
    />
  );
}

