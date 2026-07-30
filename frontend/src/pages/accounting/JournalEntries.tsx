import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GeneralJournalEntryModal from '../../components/accounting/GeneralJournalEntryModal';

export default function JournalEntries() {
  const navigate = useNavigate();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  return (
    <GeneralJournalEntryModal
      isOpen={true}
      onClose={() => navigate('/accounting')}
      entryId={selectedEntryId}
      onSuccess={() => {}}
    />
  );
}
