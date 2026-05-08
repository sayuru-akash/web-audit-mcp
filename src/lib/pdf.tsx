import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { AuditRun, Finding, Metric, Website } from "@/lib/types";
import { scoreLabel } from "@/lib/scoring";

type PdfInput = {
  website: Website;
  audit: AuditRun;
  findings: Finding[];
  metrics: Metric[];
};

const colors = {
  ink: "#0f172a",
  muted: "#64748b",
  border: "#dbe4ee",
  soft: "#f8fafc",
  softAlt: "#eef6ff",
  teal: "#0f766e",
  blue: "#1d4ed8",
  green: "#166534",
  amber: "#b45309",
  red: "#b91c1c",
  slate: "#334155",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: "Helvetica",
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 40,
    fontSize: 11,
    lineHeight: 1.45,
  },
  heroPage: {
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: "Helvetica",
  },
  heroTop: {
    backgroundColor: colors.softAlt,
    paddingTop: 56,
    paddingBottom: 42,
    paddingHorizontal: 42,
    minHeight: 480,
  },
  eyebrow: {
    fontSize: 10,
    color: colors.blue,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 22,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 1.15,
    maxWidth: 420,
    marginBottom: 10,
  },
  heroUrl: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 30,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 72,
    lineHeight: 0.9,
    color: colors.ink,
  },
  scoreOutOf: {
    fontSize: 20,
    color: colors.muted,
    marginLeft: 8,
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 14,
    color: colors.teal,
    marginBottom: 24,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaCard: {
    width: "47%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 12,
    color: colors.ink,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 14,
  },
  sectionIntro: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.soft,
  },
  statNumber: {
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  categoryBlock: {
    marginBottom: 18,
  },
  categoryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    color: colors.slate,
    textTransform: "capitalize",
  },
  categoryScore: {
    fontSize: 12,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  fill: {
    height: 8,
    borderRadius: 999,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colWide: {
    flex: 2.2,
    paddingRight: 8,
  },
  colMid: {
    flex: 1.2,
    paddingRight: 8,
  },
  colSmall: {
    flex: 0.9,
    textAlign: "right",
  },
  headerText: {
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  bodyText: {
    fontSize: 10.5,
    color: colors.ink,
  },
  findingCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  findingHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  findingTitle: {
    fontSize: 13,
    lineHeight: 1.25,
    maxWidth: 390,
  },
  badge: {
    fontSize: 8,
    textTransform: "uppercase",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 999,
    color: colors.white,
  },
  findingMeta: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    fontSize: 8,
    color: colors.slate,
    backgroundColor: colors.soft,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  paragraphLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 3,
    letterSpacing: 0.7,
  },
  paragraph: {
    fontSize: 10.5,
    marginBottom: 8,
    color: colors.ink,
    lineHeight: 1.45,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMetricValue(metric: Metric) {
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function scoreColor(score?: number) {
  if (score === undefined) return colors.muted;
  if (score >= 80) return colors.green;
  if (score >= 60) return colors.amber;
  return colors.red;
}

function severityColor(severity: Finding["severity"]) {
  switch (severity) {
    case "critical":
      return colors.red;
    case "high":
      return "#dc2626";
    case "medium":
      return colors.amber;
    case "low":
      return colors.blue;
    default:
      return colors.slate;
  }
}

function statusCounts(findings: Finding[]) {
  return {
    failed: findings.filter((finding) => finding.status === "failed").length,
    review: findings.filter((finding) => finding.status === "needs_review")
      .length,
    passed: findings.filter((finding) => finding.status === "passed").length,
  };
}

function PageFooter({ website }: { website: Website }) {
  return (
    <View fixed style={styles.footer}>
      <Text>Web Audit Report</Text>
      <Text>{website.domain}</Text>
    </View>
  );
}

function AuditPdfDocument({ website, audit, findings, metrics }: PdfInput) {
  const counts = statusCounts(findings);
  const categoryScores = Object.entries(audit.categoryScores ?? {});
  const failedFindings = findings
    .filter((finding) => finding.status === "failed")
    .sort((a, b) => a.sortPriority - b.sortPriority);
  const reviewFindings = findings
    .filter((finding) => finding.status === "needs_review")
    .sort((a, b) => a.sortPriority - b.sortPriority);
  const topFindings = failedFindings.slice(0, 6);
  const topMetrics = metrics.slice(0, 12);

  return (
    <Document
      title={`Audit Report - ${website.displayName}`}
      creator="Web Audit"
    >
      <Page size="A4" style={styles.heroPage}>
        <View style={styles.heroTop}>
          <Text style={styles.eyebrow}>Advanced website audit report</Text>
          <Text style={styles.heroTitle}>{website.displayName}</Text>
          <Text style={styles.heroUrl}>
            {audit.finalUrl ?? audit.requestedUrl}
          </Text>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{audit.overallScore ?? "—"}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          <Text style={styles.scoreText}>{scoreLabel(audit.overallScore)}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Audit status</Text>
              <Text style={styles.metaValue}>{audit.status}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Profile</Text>
              <Text style={styles.metaValue}>{audit.profile}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Completed</Text>
              <Text style={styles.metaValue}>
                {formatDate(audit.completedAt ?? audit.createdAt)}
              </Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>
                {audit.durationMs
                  ? `${Math.round(audit.durationMs / 1000)}s`
                  : "—"}
              </Text>
            </View>
          </View>
        </View>
        <PageFooter website={website} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive summary</Text>
        <Text style={styles.sectionIntro}>
          This report summarizes the current page audit for{" "}
          {website.displayName}. It focuses on page health, prioritized issues,
          and operational metrics captured during the audit run.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{counts.failed}</Text>
            <Text style={styles.statLabel}>Failed findings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{counts.review}</Text>
            <Text style={styles.statLabel}>Needs review</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{counts.passed}</Text>
            <Text style={styles.statLabel}>Passed checks</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Category health</Text>
        <Text style={styles.sectionIntro}>
          Scores by category help highlight where remediation effort should be
          concentrated first.
        </Text>
        {categoryScores.length > 0 ? (
          categoryScores.map(([category, score]) => (
            <View key={category} style={styles.categoryBlock}>
              <View style={styles.categoryHead}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text
                  style={[styles.categoryScore, { color: scoreColor(score) }]}
                >
                  {score}/100
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(0, Math.min(100, score))}%`,
                      backgroundColor: scoreColor(score),
                    },
                  ]}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>
            No category scores were available for this audit.
          </Text>
        )}
        <PageFooter website={website} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Performance metrics</Text>
        <Text style={styles.sectionIntro}>
          The following metrics capture measurable output from the audit. Use
          them to baseline and track improvements over time.
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colWide]}>Metric</Text>
            <Text style={[styles.headerText, styles.colMid]}>Category</Text>
            <Text style={[styles.headerText, styles.colSmall]}>Value</Text>
          </View>
          {topMetrics.length > 0 ? (
            topMetrics.map((metric, index) => (
              <View
                key={metric.id}
                style={
                  index === topMetrics.length - 1
                    ? [styles.tableRow, styles.tableRowLast]
                    : styles.tableRow
                }
              >
                <Text style={[styles.bodyText, styles.colWide]}>
                  {metric.label}
                </Text>
                <Text style={[styles.bodyText, styles.colMid]}>
                  {metric.category}
                </Text>
                <Text style={[styles.bodyText, styles.colSmall]}>
                  {formatMetricValue(metric)}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.tableRow, styles.tableRowLast]}>
              <Text style={[styles.bodyText, styles.colWide]}>
                No metrics available.
              </Text>
              <Text style={[styles.bodyText, styles.colMid]} />
              <Text style={[styles.bodyText, styles.colSmall]} />
            </View>
          )}
        </View>
        <PageFooter website={website} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Priority fixes</Text>
        <Text style={styles.sectionIntro}>
          These are the most important confirmed issues to address first based
          on severity and sort priority.
        </Text>
        {topFindings.length > 0 ? (
          topFindings.map((finding) => (
            <View key={finding.id} style={styles.findingCard}>
              <View style={styles.findingHead}>
                <Text style={styles.findingTitle}>{finding.title}</Text>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: severityColor(finding.severity) },
                  ]}
                >
                  {finding.severity}
                </Text>
              </View>
              <View style={styles.findingMeta}>
                <Text style={styles.chip}>{finding.category}</Text>
                <Text style={styles.chip}>
                  {finding.status.replace("_", " ")}
                </Text>
              </View>
              <Text style={styles.paragraphLabel}>Impact</Text>
              <Text style={styles.paragraph}>{finding.impact}</Text>
              <Text style={styles.paragraphLabel}>Recommendation</Text>
              <Text style={styles.paragraph}>{finding.recommendation}</Text>
              <Text style={styles.paragraphLabel}>Evidence</Text>
              <Text style={styles.paragraph}>{finding.evidence}</Text>
            </View>
          ))
        ) : (
          <View style={styles.findingCard}>
            <Text style={styles.findingTitle}>
              No confirmed failed findings
            </Text>
            <Text style={[styles.paragraph, { marginTop: 8 }]}>
              This audit did not produce any failed findings that require
              immediate remediation.
            </Text>
          </View>
        )}
        <PageFooter website={website} />
      </Page>

      {reviewFindings.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Manual review items</Text>
          <Text style={styles.sectionIntro}>
            These findings were flagged for human verification and are included
            for operational follow-up.
          </Text>
          {reviewFindings.slice(0, 8).map((finding) => (
            <View key={finding.id} style={styles.findingCard}>
              <View style={styles.findingHead}>
                <Text style={styles.findingTitle}>{finding.title}</Text>
                <Text style={[styles.badge, { backgroundColor: colors.blue }]}>
                  review
                </Text>
              </View>
              <View style={styles.findingMeta}>
                <Text style={styles.chip}>{finding.category}</Text>
                <Text style={styles.chip}>{finding.severity}</Text>
              </View>
              <Text style={styles.paragraphLabel}>Description</Text>
              <Text style={styles.paragraph}>{finding.description}</Text>
              <Text style={styles.paragraphLabel}>Recommendation</Text>
              <Text style={styles.paragraph}>{finding.recommendation}</Text>
            </View>
          ))}
          <PageFooter website={website} />
        </Page>
      ) : null}
    </Document>
  );
}

export async function buildAuditPdf(input: PdfInput): Promise<Buffer> {
  return renderToBuffer(<AuditPdfDocument {...input} />);
}
