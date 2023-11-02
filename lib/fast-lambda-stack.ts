import {dirname, join} from 'path';
import {fileURLToPath} from 'node:url';

import * as cdk from 'aws-cdk-lib';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {Tracing} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction, OutputFormat} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Construct} from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class FastLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const messageFunction = new NodejsFunction(this, 'MessageFunction', {
            entry: join(__dirname, '../lambda/generate-message/', 'index.ts'),
            handler: 'handler',
            tracing: Tracing.PASS_THROUGH,
            bundling: {
                banner: "import createRequire from 'create-require'; const require = createRequire(import.meta.url);",
                minify: true,
                format: OutputFormat.ESM,
                tsconfig: join(__dirname, '../tsconfig.json'),
                esbuildArgs: {
                    '--tree-shaking': 'true',
                },
                nodeModules: [],
                externalModules: [],
            },
        });

        const api = new RestApi(this, 'FastLambdaApi', {
            restApiName: 'FastLambdaApi',
            deployOptions: {
                stageName: 'v1',
                tracingEnabled: true,
            },
        });
        const messageResource = api.root.addResource('message');
        messageResource.addMethod('GET', new LambdaIntegration(messageFunction));

        new cdk.CfnOutput(this, 'MessageApiUrl', {value: api.url});
    }
}
