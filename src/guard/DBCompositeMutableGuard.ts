import { StaticImplements } from '../util/StaticImplements';
import { IDBCompositeMutable } from '../model/db/IDBCompositeMutable';
import { DBCompositeMutable } from '../db/DBCompositeMutable';

@StaticImplements<IDBCompositeMutable<any, any, any>>()
// @ts-ignore: Declared but its value is never read
class DBCompositeMutableGuard extends DBCompositeMutable<any, any, any>('') {}
