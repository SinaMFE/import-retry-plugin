import webpack from './helpers/compiler';
describe('Loader', () => {
  test('Defaults', async () => {
    const stats = await webpack('fixture.js',{output:"/dist/"});
    expect(stats.toString()).toMatchSnapshot();
  });
});
