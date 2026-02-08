
# --- DynamoDB Table for Circuit State ---

resource "aws_dynamodb_table" "circuit_breaker_state" {
  name           = "apim-circuit-breaker-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ServiceId"

  attribute {
    name = "ServiceId"
    type = "S"
  }

  ttl {
    attribute_name = "ExpirationTime"
    enabled        = true
  }

  tags = {
    Name        = "apim-circuit-breaker-${var.environment}"
    Environment = var.environment
  }
}

# --- Lambda Function for Circuit Handling ---

data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"
  
  source {
    content  = "exports.handler = async (event) => { console.log('Circuit Breaker Placeholder'); return { statusCode: 200, body: 'OK' }; };"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "circuit_breaker_handler" {
  filename         = data.archive_file.lambda_placeholder.output_path
  function_name    = "apim-circuit-breaker-handler-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      TABLE_NAME     = aws_dynamodb_table.circuit_breaker_state.name
      ERROR_THRESHOLD = var.apim_circuit_breaker_error_threshold
    }
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "apim-cb-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "DynamoDBAccess"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ]
      Effect   = "Allow"
      Resource = aws_dynamodb_table.circuit_breaker_state.arn
    }]
  })
}

# --- CloudWatch Alarms ---

resource "aws_cloudwatch_metric_alarm" "backend_5xx_errors" {
  alarm_name          = "apim-backend-5xx-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.apim_circuit_breaker_error_threshold
  alarm_description   = "Triggers when 5XX errors exceed threshold"
  
  dimensions = {
    ApiId = aws_apigatewayv2_api.apim_gateway.id
    Stage = aws_apigatewayv2_stage.apim_stage.name
  }

  # In a real setup, alarm_actions would point to an SNS topic that triggers the Lambda
  # alarm_actions = [aws_sns_topic.circuit_breaker_topic.arn]
}

resource "aws_cloudwatch_metric_alarm" "backend_high_latency" {
  alarm_name          = "apim-backend-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Average"
  threshold           = var.apim_circuit_breaker_latency_threshold_ms
  alarm_description   = "Triggers when latency exceeds threshold"

  dimensions = {
    ApiId = aws_apigatewayv2_api.apim_gateway.id
    Stage = aws_apigatewayv2_stage.apim_stage.name
  }
  
  # alarm_actions = [aws_sns_topic.circuit_breaker_topic.arn]
}
