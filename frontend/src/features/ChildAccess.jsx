
import { useState } from 'react';
import FamilyLookup from '../pages/FamilyLookup';
import ChildProfileSelection from '../pages/ChildProfileSelection';

export default function ChildAccess({ onProfileSelected }) {
  const [profiles, setProfiles] = useState(null);

  function handleBack() {
    setProfiles(null);
  }

  function handleProfileSelected(profile) {
    if (onProfileSelected) {
      onProfileSelected(profile);
    }
  }

  if (profiles === null) {
    return <FamilyLookup onSuccess={setProfiles} />;
  }

  return (
    <ChildProfileSelection
      profiles={profiles}
      onSelect={handleProfileSelected}
      onBack={handleBack}
    />
  );
}
