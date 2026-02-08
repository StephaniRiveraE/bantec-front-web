
# --- Log Group for Access Logs ---

resource "aws_cloudwatch_log_group" "apim_access_logs" {
  name              = "/aws/apigateway/apim-switch-${var.environment}"
  retention_in_days = var.apim_log_retention_days

  tags = {
    Environment = var.environment
    Application = "Switch-APIM"
  }
}

# --- CloudWatch Dashboard ---

resource "aws_cloudwatch_dashboard" "apim_dashboard" {
  dashboard_name = "APIM-Switch-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.apim_gateway.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-2"
          title   = "Total Requests"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.apim_gateway.id],
            ["AWS/ApiGateway", "IntegrationLatency", "ApiId", aws_apigatewayv2_api.apim_gateway.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-2"
          title   = "Latency (ms)"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "4xx", "ApiId", aws_apigatewayv2_api.apim_gateway.id],
            ["AWS/ApiGateway", "5xx", "ApiId", aws_apigatewayv2_api.apim_gateway.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-2"
          title   = "Errors (4xx & 5xx)"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
             # Throttling metric is not directly available per API in HTTP API without detailed metrics enabled, 
             # but assuming standard throttling metrics or using a placeholder.
             # HTTP APIs don't emit Throttling metric by default. Using 5xx as proxy for now or placeholder.
             ["AWS/ApiGateway", "DataProcessed", "ApiId", aws_apigatewayv2_api.apim_gateway.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-2"
          title   = "Data Processed"
          period  = 60
        }
      }
    ]
  })
}
