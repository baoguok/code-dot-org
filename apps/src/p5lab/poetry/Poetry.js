import SpriteLab from '../spritelab/SpriteLab';
import PoetryLibrary from './PoetryLibrary';

export default class Poetry extends SpriteLab {
  createLibrary(args) {
    if (!args.p5) {
      console.warn('cannot create poetry library without p5 instance');
      return;
    }
    return new PoetryLibrary(args.p5);
  }
}
