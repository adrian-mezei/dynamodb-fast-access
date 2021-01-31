import { DynamoDBConfigModel } from './../model/ConfigModels';
import * as AWS from 'aws-sdk';

export class DatabaseConfig {
    public static DynamoDBConfig: DynamoDBConfigModel;
    
    private static DynamoDBDocumentClientInstance: AWS.DynamoDB.DocumentClient;
    
    public static DynamoDBDocumentClient(): AWS.DynamoDB.DocumentClient {
        if(!this.DynamoDBDocumentClientInstance) {
            this.DynamoDBDocumentClientInstance = new AWS.DynamoDB.DocumentClient(
                { 
                    apiVersion: '2012-08-10'
                }
            );
        }
        return this.DynamoDBDocumentClientInstance;
    }
    
    public static init(config: DynamoDBConfigModel, awsDynamoDBDocumentClient?: AWS.DynamoDB.DocumentClient) {
        if(awsDynamoDBDocumentClient) this.DynamoDBDocumentClientInstance = awsDynamoDBDocumentClient;
        this.DynamoDBConfig = config;
    }
}
