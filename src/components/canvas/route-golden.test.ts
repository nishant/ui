import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { benchGraph } from '../../../tools/canvas-bench-graph.mjs';
import { layoutCandidates } from './layout';
import { routeEdges } from './route';

// Hashes of the lines the router produced before the speed-up. A change here means the output changed.
const GOLDEN: Record<string, string[]> = {
  '20/1': [
    'ae780d92184d71e337a97d469d47ed34290f4b76b7ba056559623c61f9ed559b',
    '8e3c41dd88fdee36951b62775e8b061e8dbf59985730057e56e8ab8f16971ab4',
    '41720bd387fe10a5b2d792ab77623f2d04bc112c67fa1015004aa9ad03dbcd96',
  ],
  '50/2': [
    'cd34099ce8b1825bb8aad8edfc5c015749c481c1b3dc6c98485f64b834149ffa',
    '031349aee7f4bf6547c1bb4ac6f219241142eed3b56f7a6a2cc65c5c2384735b',
    'ee9a251785306cbe57b16052cdba8b6c304da1c07ded6e70592455acdb7b551c',
    'c565c697c6a8aee6017aecdaae01d2f581176f83470cd938c478911efe1a4a26',
    '75b17241ece6e2b0a891ad036516d9e49e6eae08c9848c9bb382829336a88479',
  ],
  '120/3': [
    '46ed45b306db611cf469ba2a4990be0525e6bdc6564fb18cee182cf393f7c01d',
    'b03b92b933b4618adb91a26ade73bd40f7eee589c07dd31bdfc981668facec66',
    '85fbae4fd5689efd8150f8659e855317aa546105e3129bced1c315e2628c2a8f',
    '1a0fd373503fee41db4bd42e3aff401f6fe2993663d652210fe0266d99d8c384',
    '4e1620f7e6feaa19319524c82d51ec0bece94f918bca7ba8e405e87d8833bceb',
    '8a1fb5b325c318d57ae451d9c8847d5e6bf496975a7f4bdf6776f653ccc5b281',
  ],
  '300/4': [
    'a9174c47a8901756d0d59eafa9e51cf4eaa7ae75d7000963e87f98760ed429de',
    'd8f04bcb4decabdc90408be11a7d1e8cd386d565117c1eb74cbb1aa5c3291fbf',
    '5b90a4f622f723c152c39ef55cd47a06692fb5b1e058e609c189dc90ae8bada4',
    'cd9d566025fb1ebd6380abd2d3412e25a7995f7fe992920e4bfdc44786498e3f',
    'a1e0d34a4ce07f79066cf4c58ba6d01b1a0a85920c0091bd7515557c1cb67604',
    '1b8a5ac1b948f9826be41d5e5010ffe2a8693ca522f2dff22acc691f72b0a7fc',
    '1de0bcd39517df50830aa47cd36e0e0d9874b53c229dedfb8c596c47e589e574',
    '28e2cacc070113682a40d3bc86d55f68b8f8896d619641306bbf77c34700281e',
    'ba8e35e7410e8a301e42863e4562b79f2da7093ff91e51020592818fcf59a00a',
    '6b3f3d0717e91f341615ea4130da15aa3fa65579ac525d352dac269b1f04e956',
  ],
  '500/5': [
    '97e71381fb3a45f8e05de2ab619e2a908dcd7d696f88867be5aa0428d71fc98f',
    'bc12096784e70b148a6440a6d8716d02febc6e777b0bd53abea1b6b8911f0586',
    'fee91cfd7304ad7af01e916df4739b4eb8eb3312c9da9ea59cecff8213ca2cdf',
    '75115300cbebf6fa4e880d6231fba304c3650439baa6b1f1c53c172b9a28eb0d',
    '14a3fa2fcf437203f11b2d9f3badc8d522c821d1da9f19ad4c9fee4e33f5c6f0',
    'c77b3e81b00e37607b50ec89f1d02d29566001ff37b5e814f90a796ade568fa4',
    'a2dd94c8c6998474838ee104c77ab4237225f75ddd2f66d7c38e910cb5f000f3',
    '62b62d551a6d4eb5c429b7e22f8d8d2dc3854d13b69cf7bbbbe37f91707fb19b',
    '058b66fc5f56386f167f61f97d6d440bde2e3d8f1660b6812b1eef0c941fc596',
    '0f2fd1ad6cc96c46aa254964200f26fbc610fb32978ad583604f00b01fff3063',
    '1eb4e4cce09f84c62bc3beddfc316056df47bafded98ba9e60bf6bb7d90d171f',
    '3bfe7f2e0838007668f4a7fd3b150761d547ac0e7888df66fa1196cb7a9a1bef',
    'a8614ff714ddff35a08b1a318c21e7c9c8d6e888f07e12cb133446546f85a1b3',
    '2bda8ed965e836d268aab45f5b9306a5c7056cd811454161dde970eda5bf8cdc',
    'f0ee8f18d23095a930b955179250df19c799864bb454a6c87a4d8dc2c07e2adf',
    '3968dcce2340cd70e8890ac02c4b149eb601939e2e61ecc7b229082ecd57c641',
    '65f4819745e1e8723b69f8e08798dc6d6dee274f05cc94aeb6641f43c9137351',
    'b1ed0873d0a56c51e676f0937fb34cc235f4322d341f216dd80f4c8d6be92816',
    '2f9253457c837110c1d38664bac07b86ddb130d52841bc214a18c6c5714479ed',
    '2712195aede804ec8324db49553298dcbd398db9faa75b5451ad89ffb4944c8e',
    'b6ad3d8590c111ab1039a523027d7d367f65f6e9e1d0a037502890eb460562d9',
    'aed83b7a6b576e825029cc8bc6527469c448a81e8b0ba622e827ab0e69f594e9',
  ],
};

const CASES: [nodes: number, edgesPerNode: number, seed: number][] = [
  [20, 2, 1],
  [50, 1.5, 2],
  [120, 2, 3],
  [300, 1.5, 4],
  [500, 1.5, 5],
];

const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

function hashes(nodes: number, edgesPerNode: number, seed: number): string[] {
  const { groups, edges } = benchGraph({ nodes, edgesPerNode, seed });
  const c = layoutCandidates(groups, edges, 'auto');
  const layouts = [c.columns!, ...c.bands];
  return layouts.map((layout) => sha(routeEdges(layout, groups, edges)));
}

describe('routeEdges golden output', () => {
  if (process.env.NISH_ROUTE_GOLDEN_PRINT) {
    it('prints the hashes', () => {
      const out: Record<string, string[]> = {};
      for (const [n, e, s] of CASES) out[`${n}/${s}`] = hashes(n, e, s);
      console.log(JSON.stringify(out, null, 2));
    });
    return;
  }

  for (const [n, e, s] of CASES) {
    it(`${n} nodes, seed ${s}: every layout routes to the recorded lines`, () => {
      expect(hashes(n, e, s)).toEqual(GOLDEN[`${n}/${s}`]);
    });
  }

  it('routes the same input to equal output twice', () => {
    const { groups, edges } = benchGraph({ nodes: 120, edgesPerNode: 2, seed: 3 });
    const c = layoutCandidates(groups, edges, 'auto');
    expect(routeEdges(c.columns!, groups, edges)).toEqual(routeEdges(c.columns!, groups, edges));
  });
});
