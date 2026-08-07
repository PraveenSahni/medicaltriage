# External HTTPS Load Balancer + Serverless NEGs, fronting BOTH
# ist-triage-demo and ist-triage-soc2 Cloud Run services. Deliberately kept
# in its own file, separate from main.tf (which is explicitly soc2-only per
# its own header) - this is a shared resource spanning both environments,
# same reasoning as why the shared Cloud SQL instance is excluded from
# main.tf. See docs/infrastructure/load-balancer-migration-plan.md for the
# full rationale and phased rollout (this file covers Phase 0/Phase 1 -
# additive only, no traffic is routed through here until the DNS cutover
# described as Phase 2 in that plan, which is a separate, later step).

resource "google_compute_global_address" "lb_ip" {
  name = "ist-triage-lb-ip"
}

resource "google_compute_managed_ssl_certificate" "demo" {
  name = "ist-triage-demo-cert"
  managed {
    domains = ["triaged.irisstar.tech"]
  }
}

resource "google_compute_managed_ssl_certificate" "soc2" {
  name = "ist-triage-soc2-cert"
  managed {
    domains = ["triagedsoc2.irisstar.tech"]
  }
}

resource "google_compute_region_network_endpoint_group" "demo" {
  name                  = "ist-triage-demo-neg"
  region                = "me-central1"
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = "ist-triage-demo"
  }
}

resource "google_compute_region_network_endpoint_group" "soc2" {
  name                  = "ist-triage-soc2-neg"
  region                = "me-central1"
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = "ist-triage-soc2"
  }
}

resource "google_compute_backend_service" "demo" {
  name                  = "ist-triage-demo-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  # Cloud CDN intentionally off - the exact class of bug this migration
  # fixes was a proxy not forwarding a header; adding a cache layer back in
  # front of a Cookie-sensitive session-check endpoint would reintroduce
  # that same risk class. See the migration plan's Phase 1 notes.
  enable_cdn = false

  backend {
    group = google_compute_region_network_endpoint_group.demo.id
  }
}

resource "google_compute_backend_service" "soc2" {
  name                  = "ist-triage-soc2-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = false

  backend {
    group = google_compute_region_network_endpoint_group.soc2.id
  }
}

resource "google_compute_url_map" "ist_triage" {
  name            = "ist-triage-url-map"
  default_service = google_compute_backend_service.demo.id

  host_rule {
    hosts        = ["triaged.irisstar.tech"]
    path_matcher = "demo"
  }
  path_matcher {
    name            = "demo"
    default_service = google_compute_backend_service.demo.id
  }

  host_rule {
    hosts        = ["triagedsoc2.irisstar.tech"]
    path_matcher = "soc2"
  }
  path_matcher {
    name            = "soc2"
    default_service = google_compute_backend_service.soc2.id
  }
}

resource "google_compute_target_https_proxy" "ist_triage" {
  name    = "ist-triage-https-proxy"
  url_map = google_compute_url_map.ist_triage.id
  ssl_certificates = [
    google_compute_managed_ssl_certificate.demo.id,
    google_compute_managed_ssl_certificate.soc2.id,
  ]
}

resource "google_compute_global_forwarding_rule" "ist_triage" {
  name                  = "ist-triage-https-forwarding-rule"
  target                = google_compute_target_https_proxy.ist_triage.id
  ip_address            = google_compute_global_address.lb_ip.id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
