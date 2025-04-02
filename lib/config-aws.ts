import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class AwsTextractStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Criar bucket para PDFs
        const inputBucket = new s3.Bucket(this, 'InputPDFBucket', {
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(5), // Apaga ficheiros após 30 dias
                },
            ],
        });

        // Criar bucket para JSONs processados
        const outputBucket = new s3.Bucket(this, 'OutputJSONBucket', {
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(5), // Apaga ficheiros após 30 dias
                },
            ],
        });

        // Criar SNS Topic
        const textractTopic = new sns.Topic(this, 'TextractCompletionTopic');

        // Criar Role para Lambdas
        const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTextractFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'),
            ],
        });

        // Criar Lambda para iniciar Textract
        const startTextractLambda = new lambda.Function(this, 'StartTextractLambda', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.example.StartTextractLambda',
            code: lambda.Code.fromAsset('../lambdas/start-textract/target/function.zip'),
            role: lambdaRole,
        });

        // Configurar o Bucket para chamar a Lambda ao enviar um PDF
        inputBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3notifications.LambdaDestination(startTextractLambda));

        // Criar Lambda para processar resultados do Textract
        const processTextractLambda = new lambda.Function(this, 'ProcessTextractLambda', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.example.ProcessTextractLambda',
            code: lambda.Code.fromAsset('../lambdas/process-textract/target/function.zip'),
            role: lambdaRole,
        });

        // Configurar SNS para chamar a segunda Lambda
        textractTopic.addSubscription(new snsSubscriptions.LambdaSubscription(processTextractLambda));

        // Saídas
        new cdk.CfnOutput(this, 'InputBucketName', { value: inputBucket.bucketName });
        new cdk.CfnOutput(this, 'OutputBucketName', { value: outputBucket.bucketName });
    }
}