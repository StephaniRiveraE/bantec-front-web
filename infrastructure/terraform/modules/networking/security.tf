variable "vpc_id" {
  description = "ID of the VPC where the Security Group will be created"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

resource "aws_security_group" "apim_vpc_link_sg" {
  name        = "apim-vpc-link-sg-${var.environment}"
  description = "Security Group for API Gateway VPC Link egress traffic"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all egress traffic from API Gateway to VPC resources"
  }

  tags = {
    Name        = "apim-vpc-link-sg-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "APIM"
  }
}

output "security_group_id" {
  description = "The ID of the Security Group"
  value       = aws_security_group.apim_vpc_link_sg.id
}
