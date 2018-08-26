import 'reflect-metadata';
import * as _ from './utils';

// 几个常量
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

// 在我们的这个最简化版本中，所有的依赖都是类的构造函数
export interface Provider {
  token: Token // 类的构造器
  deps?: Token[]; // 依赖项
}

// 暂时我们只提供基于class的provider
type Provider = ClassProvider;
type Token = (...args: any[]) => any;

// 就是最后做好的菜
interface Record {
  fn: Function;
  deps: Token[];
  value: any;
}

/**
 * 平坦的注♂入器
 * 这是一个平坦的模型
 */
export class FlatInjector {
  private _records: Map<Token, Record>;

  constructor(providers: Provider[] = []) {
    this._records = new Map<Token, Record>();
    _.forEach(providers, provider => this.register(provider));
  }

  // 注册一个服务到当前injector
  register(provider: Provider) {
    const deps = computeDeps(provider);
    const record = {
      fn: provider.provide,
      deps,
      value: EMPTY
    };
    this._records.set(provider.provide, record);
  }

	// 获取你想要的服务, token似乎等价于provider中的provide
	get(token: Token): any {
    return this._tryResolveToken(token);
	}

  /**
   * record换value
   */
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

  // 通过token查询对应的record，并且利用这个record来解析出实例
  private _tryResolveToken(token: any): any {
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
 * 对于一个Provider，通过这个工具函数计算出他的依赖
 * 并且没有显式的声明依赖那么我们通过元反射API查询一次依赖
 */
function computeDeps(provider: Provider): Token[] {
  const deps = Reflect.getMetadata(
    "design:paramtypes",
    provider.provide
  ) || [];
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

injector.register({
  provide: Sun,
  useClass: Sun
});
injector.register({
  provide: Flower,
  useClass: Flower
});
injector.register({
  provide: Bird,
  useClass: Bird
});
injector.register({
  provide: AK47,
  useClass: AK47
});
injector.register({
  provide: Student,
  useClass: Student
});
injector.get(Student as any);

// 负责各种与后台通信的API的请求调用
class ApiService {
  constructor() {
  }
}

// 负责各种持久化存储的服务
class StoreService {
  constructor() {

  }
}

// 主模块
class MainModule {
  private _apiService: ApiService;
  private _storeService: StoreService;

  constructor() {
    this._apiService = new ApiService();
    this._storeService = new StoreService();
  }
}

// 后来随着业务越发复杂我们将主模块的业务，拆分成了几个专属的功能模块

/**
 * 这个模块负责与用户相关的各种业务逻辑的实现
 */
class UserService {
  constructor(
    private _apiService: ApiService,
    private _stroeService: StoreService
  ) { }
}

class ArticleService {
  constructor(
    private _apiService: ApiService,
    private _storeService: StoreService,
    private _userService: UserService
  ) { }
}

/**
 * 现在我们的主模块变得更加复杂
 * TODO 依赖图
 */
class MainModule1 {
  private _apiService: ApiService;
  private _storeService: StoreService;
  private _userService: UserService;
  private _articleService: ArticleService;

  constructor() {
    const apiService = new ApiService();
    const storeService = new StoreService();
    const userService = new UserService(apiService, storeService);
    const articleService = new ArticleService(apiService, storeService, userService);

    this._apiService = apiService;
    this._storeService = storeService;
    this._userService = userService;
    this._articleService = articleService;
  }
}

class MainModule2 {
  
}

// TODO 这个讲解。。。比较难找到一个更好的例子了
// 随着业务的发展，考虑模块和业务变得更加更加复杂的情况，这个时候我们又引入了3个新的服务用来做一些事情

