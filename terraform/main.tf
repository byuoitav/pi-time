terraform {
  backend "s3" {
    bucket     = "terraform-state-storage-586877430255"
    lock_table = "terraform-state-lock-586877430255"
    region     = "us-west-2"

    // THIS MUST BE UNIQUE
    key = "pi-time.tfstate"
  }
}

provider "aws" {
  region = "us-west-2"
}

data "aws_ssm_parameter" "eks_cluster_endpoint" {
  name = "/eks/av-cluster-endpoint"
}

provider "kubernetes" {
  host = data.aws_ssm_parameter.eks_cluster_endpoint.value
}

// pull all env vars out of ssm
data "aws_ssm_parameter" "dev_client_key" {
  name = "/env/ytime/dev-client-key"
}

data "aws_ssm_parameter" "dev_client_secret" {
  name = "/env/ytime/dev-client-secret"
}

module "deployment" {
  source = "github.com/byuoitav/terraform//modules/kubernetes-deployment"

  // required
  name           = "pi-time-dev"
  image          = "docker.pkg.github.com/byuoitav/pi-time/pi-time-dev"
  image_version  = "fbbf239"
  container_port = 8080
  repo_url       = "https://github.com/byuoitav/pi-time"

  // optional
  image_pull_secret = "github-docker-registry"
  public_urls       = ["ytime-dev.av.byu.edu"]
  container_env = {
    "DB_ADDRESS"       = data.aws_ssm_parameter.dev_couch_address.value
    "DB_USERNAME"      = data.aws_ssm_parameter.dev_couch_username.value
    "DB_PASSWORD"      = data.aws_ssm_parameter.dev_couch_password.value
    "STOP_REPLICATION" = "true"
    "CODE_SERVICE_URL" = data.aws_ssm_parameter.dev_code_service_address.value
    "HUB_ADDRESS"      = data.aws_ssm_parameter.dev_hub_address.value
  }
  container_args = [
    "--port", "8080",
    "--log-level", "1", // set log level to info
  ]
}
