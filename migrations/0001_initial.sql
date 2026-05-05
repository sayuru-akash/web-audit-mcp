CREATE TYPE audit_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE audit_profile AS ENUM ('desktop', 'mobile');
CREATE TYPE schedule_frequency AS ENUM ('manual', 'daily', 'weekly', 'monthly');
CREATE TYPE severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE finding_status AS ENUM ('passed', 'failed', 'skipped');
CREATE TYPE audit_category AS ENUM ('performance', 'seo', 'accessibility', 'security', 'technical', 'mobile');
CREATE TYPE notification_type AS ENUM ('audit_completed', 'audit_failed', 'critical_issue', 'score_dropped', 'scheduled_completed');

CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  default_audit_frequency schedule_frequency DEFAULT 'manual',
  notify_on_audit_completed boolean NOT NULL DEFAULT true,
  notify_on_audit_failed boolean NOT NULL DEFAULT true,
  notify_on_critical_issue boolean NOT NULL DEFAULT true,
  notify_on_score_drop boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

CREATE TABLE websites (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  original_url text NOT NULL,
  normalized_url text NOT NULL,
  domain text NOT NULL,
  favicon_url text,
  schedule_frequency schedule_frequency NOT NULL DEFAULT 'manual',
  schedule_enabled boolean NOT NULL DEFAULT false,
  last_scheduled_run_at timestamptz,
  next_scheduled_run_at timestamptz,
  alert_threshold integer NOT NULL DEFAULT 10,
  last_audit_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT websites_user_url_unique UNIQUE (user_id, normalized_url)
);
CREATE INDEX websites_user_idx ON websites(user_id);
CREATE INDEX websites_schedule_idx ON websites(schedule_enabled, next_scheduled_run_at);

CREATE TABLE audit_runs (
  id text PRIMARY KEY,
  website_id text NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status audit_status NOT NULL DEFAULT 'queued',
  requested_url text NOT NULL,
  final_url text,
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  overall_score integer,
  category_scores jsonb,
  duration_ms integer,
  profile audit_profile NOT NULL DEFAULT 'desktop',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_runs_user_idx ON audit_runs(user_id);
CREATE INDEX audit_runs_website_idx ON audit_runs(website_id);
CREATE INDEX audit_runs_status_idx ON audit_runs(status, created_at);

CREATE TABLE findings (
  id text PRIMARY KEY,
  audit_run_id text NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  category audit_category NOT NULL,
  severity severity NOT NULL,
  status finding_status NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  evidence text NOT NULL,
  impact text NOT NULL,
  recommendation text NOT NULL,
  technical_details text,
  sort_priority integer NOT NULL
);
CREATE INDEX findings_audit_idx ON findings(audit_run_id);
CREATE INDEX findings_severity_idx ON findings(severity);

CREATE TABLE metrics (
  id text PRIMARY KEY,
  audit_run_id text NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  category audit_category NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  unit text
);
CREATE INDEX metrics_audit_idx ON metrics(audit_run_id);

CREATE TABLE notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id text REFERENCES websites(id) ON DELETE SET NULL,
  audit_run_id text REFERENCES audit_runs(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id, created_at);

CREATE TABLE share_links (
  id text PRIMARY KEY,
  audit_run_id text NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX share_links_audit_idx ON share_links(audit_run_id);

CREATE TABLE password_reset_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX password_reset_user_idx ON password_reset_tokens(user_id);
