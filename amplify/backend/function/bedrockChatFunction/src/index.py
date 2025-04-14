import json
import os
import boto3
from botocore.exceptions import ClientError

# Create Bedrock Runtime client
region = os.environ.get('REGION')
bedrock_runtime = boto3.client(
    service_name='bedrock-runtime',
    region_name=region
)

def handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        messages = body.get('messages', [])
        max_tokens = body.get('max_tokens', 1000)
        
        # Validate messages format
        if not messages or not isinstance(messages, list):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                'body': json.dumps({'error': 'Invalid or empty messages array'})
            }
        
        # Format messages for Claude API
        # Claude expects messages in the format: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        # We're already using this format in our frontend, so we can pass it directly
        
        # Prepare request for Claude 3.7 Sonnet
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "messages": messages
        }
        
        # Call Bedrock
        response = bedrock_runtime.invoke_model(
            modelId='us.anthropic.claude-3-7-sonnet-20250219-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read().decode())
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            'body': json.dumps({'error': str(e)})
        }