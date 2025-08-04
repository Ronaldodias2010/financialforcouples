# Configuração do provedor AWS
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend para armazenar o estado do Terraform (opcional)
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "couples-financials/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Configuração do provedor AWS
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Couples Financials"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Dados da VPC padrão
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Dados das zonas de disponibilidade
data "aws_availability_zones" "available" {
  state = "available"
}

# Security Group para ECS
resource "aws_security_group" "ecs_sg" {
  name_prefix = "${var.app_name}-ecs-"
  vpc_id      = data.aws_vpc.default.id

  # Permitir tráfego HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Permitir tráfego HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Permitir todo tráfego de saída
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-sg"
  }
}

# Security Group para ALB
resource "aws_security_group" "alb_sg" {
  name_prefix = "${var.app_name}-alb-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}