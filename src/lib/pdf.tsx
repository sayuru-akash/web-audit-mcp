import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { AuditRun, Finding, Metric, Website } from "@/lib/types";
import { scoreLabel } from "@/lib/scoring";

const colors = {
  ink: "#111827",
  muted: "#64748b",
  border: "#e5e7eb",
  soft: "#f8fafc",
  teal: "#0f766e",
  red: "#991b1b",
  amber: "#92400e",
  green: "#166534",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: colors.ink,
    fontFamily: "Helvetica",
    padding: 56,
  },
  cover: {
    backgroundColor: "#ffffff",
    color: colors.ink,
    fontFamily: "Helvetica",
  },
  coverBand: {
    height: 420,
    paddingHorizontal: 56,
    paddingTop: 78,
    backgroundColor: colors.soft,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 42,
    textTransform: "uppercase",
  },
  siteName: {
    fontSize: 54,
    lineHeight: 1.06,
    maxWidth: 360,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 86,
  },
  score: {
    fontSize: 96,
    lineHeight: 0.9,
  },
  scoreSuffix: {
    color: colors.muted,
    fontSize: 22,
    marginBottom: 12,
    marginLeft: 8,
  },
  scoreLabel: {
    color: colors.teal,
    fontSize: 16,
    marginTop: 18,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 1.1,
    marginBottom: 52,
  },
  category: {
    marginBottom: 40,
  },
  categoryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryName: {
    color: colors.muted,
    fontSize: 15,
  },
  categoryScore: {
    fontSize: 18,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  fill: {
    height: 10,
    borderRadius: 5,
  },
  issue: {
    minHeight: 96,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 30,
    padding: 24,
    flexDirection: "row",
  },
  severity: {
    width: 78,
    fontSize: 10,
    lineHeight: 1.4,
    textTransform: "uppercase",
  },
  issueTitle: {
    flex: 1,
    fontSize: 19,
    lineHeight: 1.28,
  },
});

function scoreColor(score: number) {
  if (score >= 80) return colors.teal;
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

function AuditPdfDocument({
  website,
  audit,
  findings,
}: {
  website: Website;
  audit: AuditRun;
  findings: Finding[];
}) {
  const confirmed = findings.filter((finding) => finding.status === "failed");
  const priority = confirmed.slice(0, 4);
  const categoryScores = Object.entries(audit.categoryScores ?? {});

  return (
    <Document title={`Web Audit - ${website.displayName}`} creator="Web Audit">
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverBand}>
          <Text style={styles.eyebrow}>Web audit</Text>
          <Text style={styles.siteName}>{website.displayName}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{audit.overallScore ?? "-"}</Text>
            <Text style={styles.scoreSuffix}>/100</Text>
          </View>
          <Text style={styles.scoreLabel}>{scoreLabel(audit.overallScore)}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>Health</Text>
        {categoryScores.map(([category, score]) => (
          <View key={category} style={styles.category}>
            <View style={styles.categoryHead}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.categoryScore}>{score}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${score}%`, backgroundColor: scoreColor(score) }]} />
            </View>
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>Fixes</Text>
        {priority.length > 0 ? (
          priority.map((finding) => (
            <View key={finding.id} style={styles.issue}>
              <Text style={[styles.severity, { color: finding.severity === "high" ? colors.red : colors.amber }]}>{finding.severity}</Text>
              <Text style={styles.issueTitle}>{finding.title}</Text>
            </View>
          ))
        ) : (
          <View style={styles.issue}>
            <Text style={[styles.issueTitle, { color: colors.teal }]}>No confirmed failed findings</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function buildAuditPdf({
  website,
  audit,
  findings,
}: {
  website: Website;
  audit: AuditRun;
  findings: Finding[];
  metrics: Metric[];
}): Promise<Buffer> {
  return renderToBuffer(<AuditPdfDocument website={website} audit={audit} findings={findings} />);
}
