import { calibratedBusinessCaseData } from "./calibrated-recovery";
import {dataOrSeed} from '../../server/business-case/store';

export async function loadJapanBusinessCase() {
  const [{ activeOurSolutionDataOrSeed }, { japanBusinessCaseProfile }] = await Promise.all([
    import('../../server/our-solution/store'),
    import('./japan-profile'),
  ]);
  const profile = japanBusinessCaseProfile((await activeOurSolutionDataOrSeed('JP')).data);
  return { ...profile, data: calibratedBusinessCaseData(profile.data) };
}

export async function loadMasterData(regionCode?: unknown) {
  return regionCode === 'JP' ? (await loadJapanBusinessCase()).data : calibratedBusinessCaseData(await dataOrSeed());
}
