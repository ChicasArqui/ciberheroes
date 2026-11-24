import { useState } from 'react';
import FamilyLookup from '../pages/FamilyLookup';
import ChildProfileSelection from '../pages/ChildProfileSelection';

export default function ChildAccess({ onChangeRole, onProfileSelected }) {
  const [profiles, setProfiles] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  function handleBack() {
    setProfiles(null);
    setSelectedProfile(null);
  }

  function handleProfileSelected(profile) {
    setSelectedProfile(profile);
    onProfileSelected?.(profile);
  }

  if (profiles === null) {
    return <FamilyLookup onSuccess={setProfiles} onChangeRole={onChangeRole} />;
  }

  return (
    <ChildProfileSelection
      profiles={profiles}
      selectedProfile={selectedProfile}
      onSelect={handleProfileSelected}
      onBack={handleBack}
    />
  );
}
