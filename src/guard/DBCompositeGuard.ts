import { StaticImplements } from '../util/StaticImplements';
import { IDBComposite } from '../model/db/IDBComposite';
import { DBComposite } from '../db/DBComposite';

@StaticImplements<IDBComposite<any, any>>()
// @ts-ignore: Declared but its value is never read
class DBCompositeGuard extends DBComposite<any, any>('') {}
