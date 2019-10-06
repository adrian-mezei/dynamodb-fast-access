import { StaticImplements } from '../util/StaticImplements';
import { IDBMutable } from '../model/db/IDBMutable';
import { DBMutable } from '../db/DBMutable';

@StaticImplements<IDBMutable<any, any, any>>()
// @ts-ignore: Declared but its value is never read
class DBMutableGuard extends DBMutable<any, any, any>('') {}
