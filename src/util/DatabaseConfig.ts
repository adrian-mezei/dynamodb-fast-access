import { DynamoDBConfigModel } from './../model/ConfigModels';

const AWS = require('aws-sdk');

export class DatabaseConfig {
    public static DynamoDBConfig: DynamoDBConfigModel;
    
    private static DynamoDBDocumentClientInstance: AWS.DynamoDB.DocumentClient;
    
    public static DynamoDBDocumentClient(): AWS.DynamoDB.DocumentClient {
        if(!this.DynamoDBDocumentClientInstance) 
            this.DynamoDBDocumentClientInstance = new AWS.DynamoDB.DocumentClient(
                { 
                    apiVersion: this.DynamoDBConfig.apiVersion,
                    maxRetries: this.DynamoDBConfig.maxRetries
                }
            );
        return this.DynamoDBDocumentClientInstance;
    }
    
    public static init(config: DynamoDBConfigModel) {
        this.DynamoDBConfig = config;
    }
}
