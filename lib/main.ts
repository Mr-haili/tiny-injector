import 'reflect-metadata';
import * as _ from './utils';

// 几个常量定义
const IDENT = function<T>(value: T): T { return value; };
const EMPTY = <any[]>[];
const CIRCULAR = IDENT;
const USE_VALUE = 'useValue';

// 装饰器，现在的作用仅仅是帮助我们开启元反射功能
function Injectable() {
  return function(target: any){
    return target;
  }
}

// 一个类的Token就是这个类的构造函数
type Token = { new(...args: any[]): any; };

// 整个实例化的记录过程
interface Record {
  fn: Function;
  deps: Token[];
  value: any;
}

/**
 * 在当前的实现中，所有依赖都存放在一个平坦的命名空间当中
 */
export class FlatInjector {
  private _records: Map<Token, Record>;

  constructor(tokens: Token[] = []) {
    this._records = new Map<Token, Record>();
    _.forEach(tokens, token => this.register(token));
  }

  register(token: Token) {
    const deps = computeDeps(token);
    const record = {
      fn: token,
      deps,
      value: EMPTY
    };
    this._records.set(token, record);
  }

	get(token: Token): any {
    return this._tryResolveToken(token);
	}

  private _resolveRecord(record: Record): any {
    let value = record.value;
    if(value === EMPTY) {
      const obj = undefined,
        fn = record.fn,
        deps = record.deps,
        depValues = this._resolveDependencyTokens(deps);

      // 已经解决完依赖，让我们进行初始化吧，现在提供2个初始化的方式new 和 单纯的函数调用
      record.value = value = new (fn as any)(...depValues);
    }
    return value;
  }

  // 通过token查询对应的record，并且利用这个record来获取token对应的实例
  private _tryResolveToken(token: Token): any {
    const record: Record | undefined = this._records.get(token);
    if(!record) {
      throw `依赖错误：${token}`;
    }
    return this._resolveRecord(record);
  }  

  // 解析依赖，并实例化依赖
  private _resolveDependencyTokens(tokens: Token[]): any[] {
    const injector = this, deps: any[] = [];
    _.forEach(tokens, token => {
      const dep = injector._tryResolveToken(token);
      deps.push(dep);
    });
    return deps;
  }
}

/**
 * 对于任何一个Token，通过这个工具函数计算出他的依赖
 * 并且没有显式的声明依赖那么我们通过元反射API查询一次依赖
 */
function computeDeps(token: Token): Token[] {
  const deps = Reflect.getMetadata("design:paramtypes", token) || [];
  return deps;
}


/* DEEP♂DARK♂FANTASY */
class Sun {
  constructor() {
    console.log('太阳当红照');
  }
}

class Flower {
  constructor() {
    console.log('花儿对我笑');
  }
}

class Bird {
  constructor() {
    console.log('小鸟说早早早');
  }
}

class AK47 {
  constructor() {
    console.log('你为什么背上炸药包');
  }
}

@Injectable()
class Student {
  constructor(
    sun: Sun,
    flower: Flower,
    bird: Bird,
    ak47: AK47
  ) { }
}

console.log('-----------------');
const injector = new FlatInjector();

[Sun, Bird, AK47, Student, Flower].forEach(token => {
  injector.register(token)
});

injector.get(Student);