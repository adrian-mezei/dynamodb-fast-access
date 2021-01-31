import { IDBComposite } from './IDBComposite';
import { IDBMutable } from './IDBMutable';

export interface IDBCompositeMutable<EntityModel, EntityRawModel, EntityUpdateModel>
    extends IDBComposite<EntityModel, EntityRawModel>,
        IDBMutable<EntityModel, EntityRawModel, EntityUpdateModel> {}
