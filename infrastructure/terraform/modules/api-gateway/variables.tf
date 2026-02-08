variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the backend resides"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for VPC Link"
  type        = list(string)
}

variable "apim_vpc_link_security_group_id" {
  description = "Security Group ID for the VPC Link"
  type        = string
}

variable "cognito_endpoint" {
  description = "Cognito User Pool Endpoint (without https://)"
  type        = string
}

variable "cognito_client_ids" {
  description = "List of allowed Cognito Client IDs (Audience)"
  type        = list(string)
}

variable "internal_secret_value" {
  description = "Secret value for x-origin-secret header"
  type        = string
  sensitive   = true
}

variable "apim_log_retention_days" {
  description = "Retention days for CloudWatch logs"
  type        = number
  default     = 30
}

# Circuit Breaker Configuration
variable "apim_circuit_breaker_error_threshold" {
  description = "Threshold for 5xx errors to open circuit"
  type        = number
  default     = 5
}

variable "apim_circuit_breaker_latency_threshold_ms" {
  description = "Latency threshold in ms"
  type        = number
  default     = 4000
}

variable "apim_circuit_breaker_cooldown_seconds" {
  description = "Cooldown period in seconds after circuit opens"
  type        = number
  default     = 30
}

# Custom Domain (Optional)
variable "apim_enable_custom_domain" {
  description = "Enable custom domain for APIM"
  type        = bool
  default     = false
}

variable "apim_domain_name" {
  description = "Custom domain name"
  type        = string
  default     = ""
}

variable "apim_acm_certificate_arn" {
  description = "ACM Certificate ARN for custom domain"
  type        = string
  default     = ""
}
