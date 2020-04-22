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

data "aws_ssm_parameter" "dev_hub_address" {
  name = "/env/dev-hub-address"
}

data "aws_ssm_parameter" "wso2_token_refresh_url" {
  name = "/env/wso2-token-refresh-url"
}

module "dev" {
  source = "github.com/byuoitav/terraform//modules/kubernetes-statefulset"

  // required
  name                 = "pi-time-dev"
  image                = "docker.pkg.github.com/byuoitav/pi-time/pi-time-dev"
  image_version        = "4c93a8d"
  container_port       = 8463
  repo_url             = "https://github.com/byuoitav/pi-time"
  storage_mount_path   = "/opt/pi-time/"
  storage_request_size = "10Gi"

  // optional
  image_pull_secret = "github-docker-registry"
  public_urls       = ["ytime-dev.av.byu.edu"]
  container_env = {
    "CACHE_DATABASE_LOCATION" = "/opt/pi-time/cache.db"
    "CLIENT_KEY"              = data.aws_ssm_parameter.dev_client_key.value
    "CLIENT_SECRET"           = data.aws_ssm_parameter.dev_client_secret.value
    "HUB_ADDRESS"             = data.aws_ssm_parameter.dev_hub_address.value
    "TOKEN_REFRESH_URL"       = data.aws_ssm_parameter.wso2_token_refresh_url.value
    "SYSTEM_ID"               = "ITB-K8S-TC1"
  }
  container_args = [
    //    "--port", "8080",
    //    "--log-level", "1", // set log level to info
  ]
}

data "aws_ssm_parameter" "client_key" {
  name = "/env/ytime/client-key"
}

data "aws_ssm_parameter" "client_secret" {
  name = "/env/ytime/client-secret"
}

data "aws_ssm_parameter" "hub_address" {
  name = "/env/hub-address"
}

module "prd" {
  source = "github.com/byuoitav/terraform//modules/kubernetes-statefulset"

  // required
  name                 = "pi-time"
  image                = "docker.pkg.github.com/byuoitav/pi-time/pi-time-dev"
  image_version        = "4c93a8d"
  container_port       = 8463
  repo_url             = "https://github.com/byuoitav/pi-time"
  storage_mount_path   = "/opt/pi-time/"
  storage_request_size = "20Gi"

  // optional
  image_pull_secret = "github-docker-registry"
  public_urls       = ["ytime.av.byu.edu"]
  container_env = {
    "CACHE_DATABASE_LOCATION" = "/opt/pi-time/cache.db"
    "CLIENT_KEY"              = data.aws_ssm_parameter.client_key.value
    "CLIENT_SECRET"           = data.aws_ssm_parameter.client_secret.value
    "HUB_ADDRESS"             = data.aws_ssm_parameter.hub_address.value
    "TOKEN_REFRESH_URL"       = data.aws_ssm_parameter.wso2_token_refresh_url.value
    "SYSTEM_ID"               = "ITB-K8S-TC2"
  }
  container_args = [
    //    "--port", "8080",
    //    "--log-level", "1", // set log level to info
  ]
}
