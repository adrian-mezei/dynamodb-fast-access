import { StaticImplements } from '../util/StaticImplements';
import { IDB } from '../model/db/IDB';
import { DB } from '../db/DB';

@StaticImplements<IDB<any, any>>()
// @ts-ignore: Declared but its value is never read
class DBGuard extends DB<any, any>('') {}
