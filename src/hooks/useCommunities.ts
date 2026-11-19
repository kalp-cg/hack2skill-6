import { useEffect, useState } from 'react';
import { SEED_COMMUNITIES } from '../data/communities';
import { type CommunityAction, fetchCommunities, updateCommunity } from '../lib/api';
import type { CommunityGroup } from '../types/saans';

export interface CommunityMember {
  memberName: string;
  co2SavedKg: number;
  smogScore: number;
}

/** Clean-air circles, synced with the server; the seed circles keep the tab useful offline. */
export function useCommunities() {
  const [communities, setCommunities] = useState<CommunityGroup[]>(SEED_COMMUNITIES);
  const [activeId, setActiveId] = useState<string>(SEED_COMMUNITIES[0].id);

  useEffect(() => {
    fetchCommunities()
      .then((list) => {
        if (list.length > 0) setCommunities(list);
      })
      .catch(() => {
        // Offline: keep the seed circles.
      });
  }, []);

  /** Creates or joins a circle and focuses it. Returns false if the server could not be reached. */
  async function update(action: CommunityAction, member: CommunityMember): Promise<boolean> {
    try {
      const { community, communities: updated } = await updateCommunity(action, member);
      setCommunities(updated);
      setActiveId(community.id);
      return true;
    } catch {
      return false;
    }
  }

  return { communities, activeId, setActiveId, update };
}
