import { DatabaseConfig } from '../index';
import { assert } from 'chai';
import 'mocha';

describe('Configuration', () => { 
    it('should setup configuration object', () => {
        assert.isDefined(DatabaseConfig.DynamoDBConfig);
    }); 
});
