import {dataOrSeed} from '../../server/business-case/store';

export async function loadJapanBusinessCase() {
  const [{ activeOurSolutionDataOrSeed }, { japanBusinessCaseProfile }] = await Promise.all([
    import('../../server/our-solution/store'),
    import('./japan-profile'),
  ]);
  return japanBusinessCaseProfile((await activeOurSolutionDataOrSeed('JP')).data);
}

export async function loadMasterData(regionCode?: unknown) {
  return regionCode === 'JP' ? (await loadJapanBusinessCase()).data : dataOrSeed();
}
