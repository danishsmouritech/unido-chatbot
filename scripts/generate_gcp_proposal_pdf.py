"""
Generate a professional PDF for the UNIDO GCP Infrastructure Proposal.
Uses reportlab for precise layout control and professional styling.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Colors ──────────────────────────────────────────────────────────
PRIMARY = HexColor("#1a73e8")       # Google Blue
PRIMARY_DARK = HexColor("#0d47a1")
ACCENT = HexColor("#34a853")        # Google Green
LIGHT_BG = HexColor("#f8f9fa")
LIGHTER_BG = HexColor("#e8f0fe")
BORDER = HexColor("#dadce0")
TEXT_PRIMARY = HexColor("#202124")
TEXT_SECONDARY = HexColor("#5f6368")
WHITE = white
HEADER_BG = HexColor("#1a73e8")
ROW_ALT = HexColor("#f1f3f4")
SUCCESS_GREEN = HexColor("#137333")
WARN_ORANGE = HexColor("#e37400")

# ── Page dimensions ─────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 2 * cm


class ColoredBlock(Flowable):
    """A colored rectangle block used for section headers."""
    def __init__(self, width, height, color):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)


def get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=PRIMARY_DARK,
        alignment=TA_LEFT,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica',
        fontSize=14,
        leading=20,
        textColor=TEXT_SECONDARY,
        alignment=TA_LEFT,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=22,
        textColor=PRIMARY_DARK,
        spaceBefore=18,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        name='SubSection',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=TEXT_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BodyText2',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_PRIMARY,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BulletCustom',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_PRIMARY,
        leftIndent=16,
        bulletIndent=6,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name='Highlight',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=PRIMARY_DARK,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name='CodeBlock',
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=TEXT_PRIMARY,
        backColor=LIGHT_BG,
        leftIndent=10,
        rightIndent=10,
        spaceBefore=4,
        spaceAfter=4,
        borderPadding=6,
    ))
    styles.add(ParagraphStyle(
        name='SmallNote',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_SECONDARY,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=WHITE,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_PRIMARY,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_PRIMARY,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='FooterText',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_SECONDARY,
        alignment=TA_CENTER,
    ))
    return styles


def make_table(headers, rows, col_widths=None):
    """Create a styled table with header row."""
    s = get_styles()
    header_cells = [Paragraph(h, s['TableHeader']) for h in headers]
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(cell), s['TableCell']) for cell in row])

    available_width = PAGE_W - 2 * MARGIN
    if col_widths is None:
        n = len(headers)
        col_widths = [available_width / n] * n

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, ROW_ALT]),
    ]
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def make_highlight_box(text, bg_color=LIGHTER_BG, border_color=PRIMARY):
    """Create a highlighted info box."""
    s = get_styles()
    data = [[Paragraph(text, s['BodyText2'])]]
    tbl = Table(data, colWidths=[PAGE_W - 2 * MARGIN])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LINEBEFOREKIND', (0, 0), (0, -1), 'LINEBEFOREKIND'),
        ('LINEBEFORE', (0, 0), (0, -1), 3, border_color),
    ]))
    return tbl


def section_divider():
    return HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=6, spaceBefore=6)


def header_footer(canvas, doc):
    canvas.saveState()
    # Header line
    canvas.setStrokeColor(PRIMARY)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, PAGE_H - MARGIN + 10, PAGE_W - MARGIN, PAGE_H - MARGIN + 10)
    # Header text
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(TEXT_SECONDARY)
    canvas.drawString(MARGIN, PAGE_H - MARGIN + 14, "UNIDO AI Chatbot — GCP Infrastructure Proposal")
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN + 14, "Confidential")
    # Footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, MARGIN - 10, PAGE_W - MARGIN, MARGIN - 10)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(TEXT_SECONDARY)
    canvas.drawString(MARGIN, MARGIN - 22, "Document Version 1.0 — April 29, 2026")
    canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 22, f"Page {doc.page}")
    canvas.restoreState()


def first_page_header(canvas, doc):
    """No header/footer on cover page."""
    pass


def build_pdf():
    output_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'GCP_Infrastructure_Proposal.pdf')
    output_path = os.path.abspath(output_path)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 10,
        bottomMargin=MARGIN,
        title="UNIDO AI Chatbot — GCP Infrastructure Proposal",
        author="UNIDO Technical Team",
    )

    s = get_styles()
    story = []
    W = PAGE_W - 2 * MARGIN

    # ════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 60))
    story.append(ColoredBlock(W, 6, PRIMARY))
    story.append(Spacer(1, 30))
    story.append(Paragraph("UNIDO AI Chatbot", s['CoverTitle']))
    story.append(Paragraph("Google Cloud Platform<br/>Infrastructure Proposal", ParagraphStyle(
        'CoverTitle2', parent=s['CoverTitle'], fontSize=24, leading=30, textColor=PRIMARY)))
    story.append(Spacer(1, 20))
    story.append(ColoredBlock(80, 3, ACCENT))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Document Version: 1.0", s['CoverSubtitle']))
    story.append(Paragraph("Date: April 29, 2026", s['CoverSubtitle']))
    story.append(Paragraph("Prepared For: UNIDO Technical Team", s['CoverSubtitle']))
    story.append(Paragraph("Classification: Confidential", s['CoverSubtitle']))
    story.append(Spacer(1, 50))

    # Key metrics box on cover
    cover_metrics = [
        [Paragraph("<b>Estimated Monthly Cost</b>", s['TableCell']),
         Paragraph("<b>Migration Timeline</b>", s['TableCell']),
         Paragraph("<b>Code Change Effort</b>", s['TableCell'])],
        [Paragraph("$210 – $325/mo", ParagraphStyle('Metric', parent=s['TableCell'], fontSize=14, textColor=PRIMARY_DARK, fontName='Helvetica-Bold')),
         Paragraph("5 – 8 Days", ParagraphStyle('Metric2', parent=s['TableCell'], fontSize=14, textColor=PRIMARY_DARK, fontName='Helvetica-Bold')),
         Paragraph("~40% of Codebase", ParagraphStyle('Metric3', parent=s['TableCell'], fontSize=14, textColor=PRIMARY_DARK, fontName='Helvetica-Bold'))],
        [Paragraph("(Option A: Gemini Flash)", s['SmallNote']),
         Paragraph("(Working days)", s['SmallNote']),
         Paragraph("(60% unchanged)", s['SmallNote'])],
    ]
    metrics_tbl = Table(cover_metrics, colWidths=[W/3]*3)
    metrics_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHTER_BG),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY),
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, BORDER),
        ('LINEBEFORE', (2, 0), (2, -1), 0.5, BORDER),
    ]))
    story.append(metrics_tbl)
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("Table of Contents", s['SectionTitle']))
    story.append(section_divider())
    toc_items = [
        "1. Executive Summary",
        "2. Current Architecture Overview",
        "3. Proposed GCP Architecture",
        "4. GCP Service Mapping",
        "5. Infrastructure Cost Breakdown",
        "6. Required Code Changes",
        "7. Migration Timeline",
        "8. Architecture Diagrams",
        "9. Recommendations",
        "Appendix A: Environment Variables",
        "Appendix B: GCP CLI Setup Commands",
    ]
    for item in toc_items:
        story.append(Paragraph(f"● &nbsp; {item}", ParagraphStyle(
            'TOCItem', parent=s['BodyText2'], fontSize=11, leading=20, leftIndent=20)))
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 1. EXECUTIVE SUMMARY
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Executive Summary", s['SectionTitle']))
    story.append(section_divider())
    story.append(Paragraph(
        "This document outlines the proposed Google Cloud Platform (GCP) infrastructure for the UNIDO AI Chatbot "
        "application. The project currently uses Azure OpenAI, Elasticsearch, MongoDB, and Azure Blob Storage. "
        "This proposal maps each service to its GCP equivalent, provides detailed cost estimates (one-time and "
        "monthly), and outlines the code changes and timeline required for migration.",
        s['BodyText2']))
    story.append(Spacer(1, 8))
    story.append(make_highlight_box(
        "<b>Key Highlights:</b><br/>"
        "• Estimated monthly cost: <b>$210 – $325/month</b> (Gemini Flash option)<br/>"
        "• One-time migration cost: <b>$150 – $250</b> (setup and data migration)<br/>"
        "• Development effort for code changes: <b>5 – 8 working days</b><br/>"
        "• Zero downtime migration possible with phased approach<br/>"
        "• 60% of existing codebase requires <b>no changes</b>"
    ))
    story.append(Spacer(1, 10))

    # ════════════════════════════════════════════════════════════════
    # 2. CURRENT ARCHITECTURE OVERVIEW
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Current Architecture Overview", s['SectionTitle']))
    story.append(section_divider())
    story.append(Paragraph(
        "The following table summarizes all current external services and their roles in the application:",
        s['BodyText2']))
    story.append(Spacer(1, 6))
    story.append(make_table(
        ["Component", "Current Service", "Purpose"],
        [
            ["AI Chat Model", "Azure OpenAI (GPT-4o-mini)", "Generate conversational responses"],
            ["Embeddings", "Azure OpenAI (text-embedding-3-small)", "Generate 1536D vectors for RAG"],
            ["Vector Search", "Elasticsearch (managed/self-hosted)", "kNN similarity search on embeddings"],
            ["Database", "MongoDB (Atlas or self-hosted)", "Store sessions, logs, admin settings"],
            ["Object Storage", "Azure Blob Storage", "Backup scraped data (JSON files)"],
            ["Web Scraping", "Puppeteer (headless Chrome)", "Daily scraping of UNIDO careers site"],
            ["Frontend", "Static React 19 SPA (Vite)", "User-facing chatbot + admin panel"],
            ["Backend", "Node.js + Express 5", "REST API + WebSocket server"],
            ["Real-time", "Socket.io", "Live admin dashboard updates"],
            ["Scheduling", "node-cron", "Daily scraping pipeline"],
        ],
        col_widths=[W*0.18, W*0.38, W*0.44]
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Technology Stack Details:</b>", s['BodyText2']))
    story.append(Paragraph("• <b>Frontend:</b> React 19, Vite 7, Bootstrap 5, Socket.io-client, Recharts, React Router 7", s['BulletCustom']))
    story.append(Paragraph("• <b>Backend:</b> Node.js, Express 5, Mongoose 9, Puppeteer 24, Cheerio, Helmet, JWT", s['BulletCustom']))
    story.append(Paragraph("• <b>AI Pipeline:</b> RAG with text-embedding-3-small (1536D) → Elasticsearch kNN → GPT-4o-mini (temp 0.1)", s['BulletCustom']))
    story.append(Paragraph("• <b>Security:</b> bcrypt (12 rounds), JWT HS256 (25min), rate limiting, NoSQL injection guard, prompt injection detection", s['BulletCustom']))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 3. PROPOSED GCP ARCHITECTURE
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. Proposed GCP Architecture", s['SectionTitle']))
    story.append(section_divider())
    story.append(Paragraph(
        "The proposed architecture leverages GCP-native and GCP-hosted services to provide a fully managed, "
        "auto-scaling, and cost-efficient infrastructure. All services are deployed in the <b>europe-west1 "
        "(Belgium)</b> region for low latency to UNIDO headquarters in Vienna.",
        s['BodyText2']))
    story.append(Spacer(1, 8))

    # Architecture flow as a table-based diagram
    arch_data = [
        [Paragraph("<b>Layer</b>", s['TableHeader']),
         Paragraph("<b>GCP Service</b>", s['TableHeader']),
         Paragraph("<b>Purpose</b>", s['TableHeader'])],
        [Paragraph("CDN / Frontend", s['TableCell']),
         Paragraph("Firebase Hosting + Cloud CDN", s['TableCell']),
         Paragraph("Serve React SPA globally with caching", s['TableCell'])],
        [Paragraph("Security", s['TableCell']),
         Paragraph("Cloud Armor", s['TableCell']),
         Paragraph("WAF, DDoS protection, IP allowlisting", s['TableCell'])],
        [Paragraph("Compute", s['TableCell']),
         Paragraph("Cloud Run (fully managed)", s['TableCell']),
         Paragraph("Node.js backend — auto-scales, supports WebSockets", s['TableCell'])],
        [Paragraph("AI / LLM", s['TableCell']),
         Paragraph("Vertex AI (Gemini 2.0 Flash)", s['TableCell']),
         Paragraph("Chat completions, response generation", s['TableCell'])],
        [Paragraph("Embeddings", s['TableCell']),
         Paragraph("Vertex AI (text-embedding-005)", s['TableCell']),
         Paragraph("Query vectorization for semantic search", s['TableCell'])],
        [Paragraph("Vector Search", s['TableCell']),
         Paragraph("Elastic Cloud on GCP", s['TableCell']),
         Paragraph("kNN vector search — zero code changes", s['TableCell'])],
        [Paragraph("Database", s['TableCell']),
         Paragraph("MongoDB Atlas on GCP", s['TableCell']),
         Paragraph("Sessions, logs, settings — zero code changes", s['TableCell'])],
        [Paragraph("Storage", s['TableCell']),
         Paragraph("Cloud Storage (GCS)", s['TableCell']),
         Paragraph("Scraped data backups with 7-day lifecycle", s['TableCell'])],
        [Paragraph("Scheduling", s['TableCell']),
         Paragraph("Cloud Scheduler", s['TableCell']),
         Paragraph("Trigger daily scraping pipeline via HTTP", s['TableCell'])],
        [Paragraph("Secrets", s['TableCell']),
         Paragraph("Secret Manager", s['TableCell']),
         Paragraph("API keys, JWT secrets, DB credentials", s['TableCell'])],
        [Paragraph("Monitoring", s['TableCell']),
         Paragraph("Cloud Logging + Monitoring", s['TableCell']),
         Paragraph("Logs, uptime checks, alerts, dashboards", s['TableCell'])],
    ]
    arch_tbl = Table(arch_data, colWidths=[W*0.2, W*0.35, W*0.45])
    arch_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, ROW_ALT]),
    ]))
    story.append(arch_tbl)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 4. GCP SERVICE MAPPING (DETAILED)
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. GCP Service Mapping — Detailed", s['SectionTitle']))
    story.append(section_divider())

    # 4.1 Compute
    story.append(Paragraph("4.1 Compute — Cloud Run", s['SubSection']))
    story.append(make_table(
        ["Aspect", "Details"],
        [
            ["Service", "Cloud Run (fully managed, serverless containers)"],
            ["Use Case", "Host Node.js backend (Express 5 + Socket.io)"],
            ["Why Cloud Run", "Auto-scales to zero, supports WebSockets, container-based, no infra management"],
            ["Configuration", "Min instances: 1, Max instances: 10"],
            ["CPU / Memory", "1 vCPU, 1 GB RAM (scalable on demand)"],
            ["Region", "europe-west1 (Belgium) — closest to UNIDO HQ in Vienna"],
        ],
        col_widths=[W*0.25, W*0.75]
    ))
    story.append(Spacer(1, 10))

    # 4.2 AI/ML
    story.append(Paragraph("4.2 AI/ML — Vertex AI", s['SubSection']))
    story.append(Paragraph(
        "Three options are available for the AI layer. Each is compatible with the existing RAG architecture:",
        s['BodyText2']))
    story.append(Spacer(1, 4))
    story.append(make_table(
        ["Option", "Model", "Pricing (per 1M tokens)", "Pros"],
        [
            ["A (Recommended)", "Gemini 2.0 Flash", "Input: $0.10 / Output: $0.40", "Cheapest, lowest latency on GCP, excellent for RAG"],
            ["B", "OpenAI API Direct (GPT-4o-mini)", "Input: $0.15 / Output: $0.60", "Minimal code changes, proven model quality"],
            ["C", "GPT-4o-mini via Vertex AI", "Input: $0.15 / Output: $0.60 + Vertex fee", "All traffic through GCP, unified billing"],
        ],
        col_widths=[W*0.16, W*0.24, W*0.28, W*0.32]
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>Embeddings:</b> Vertex AI text-embedding-005 (768 dimensions) or continue with OpenAI text-embedding-3-small (1536D). "
        "If switching to Google embeddings, a one-time re-indexing of Elasticsearch is required.",
        s['SmallNote']))
    story.append(Spacer(1, 10))

    # 4.3 Vector Search
    story.append(Paragraph("4.3 Vector Search — Elasticsearch on Elastic Cloud", s['SubSection']))
    story.append(make_table(
        ["Aspect", "Details"],
        [
            ["Service", "Elastic Cloud on GCP (managed Elasticsearch)"],
            ["Why", "Zero code changes — same @elastic/elasticsearch client library, same kNN queries"],
            ["Alternative", "Vertex AI Vector Search (requires code rewrite, saves ~$60/month)"],
            ["Configuration", "1 node, 4 GB RAM, 120 GB storage"],
            ["Region", "GCP europe-west1"],
        ],
        col_widths=[W*0.25, W*0.75]
    ))
    story.append(Spacer(1, 10))

    # 4.4 Database
    story.append(Paragraph("4.4 Database — MongoDB Atlas on GCP", s['SubSection']))
    story.append(make_table(
        ["Aspect", "Details"],
        [
            ["Service", "MongoDB Atlas (deployed on GCP infrastructure)"],
            ["Why", "Zero code changes — Mongoose ORM works with same connection string"],
            ["Configuration", "M10 cluster (2 GB RAM, 10 GB storage) — sufficient for chat logs"],
            ["Region", "GCP europe-west1, VPC peering for private connectivity"],
            ["Collections", "chatSession, chatLog, adminUser, adminSettings"],
        ],
        col_widths=[W*0.25, W*0.75]
    ))
    story.append(Spacer(1, 10))

    # 4.5 Storage
    story.append(Paragraph("4.5 Object Storage — Cloud Storage (GCS)", s['SubSection']))
    story.append(make_table(
        ["Aspect", "Details"],
        [
            ["Service", "Google Cloud Storage"],
            ["Replaces", "Azure Blob Storage"],
            ["Use Case", "Store scraped data backups (JSON files)"],
            ["Storage Class", "Standard (or Nearline for cost savings on infrequent access)"],
            ["Lifecycle", "Auto-delete after 7 days (matching current retention policy)"],
        ],
        col_widths=[W*0.25, W*0.75]
    ))
    story.append(Spacer(1, 10))

    # 4.6 Frontend
    story.append(Paragraph("4.6 Frontend Hosting — Firebase Hosting", s['SubSection']))
    story.append(make_table(
        ["Aspect", "Details"],
        [
            ["Service", "Firebase Hosting (free tier available)"],
            ["Use Case", "Serve React SPA (static build from Vite)"],
            ["Features", "Global CDN, automatic SSL, custom domains, easy CI/CD"],
            ["Alternative", "Cloud Storage + Cloud CDN (more control, slightly more setup)"],
        ],
        col_widths=[W*0.25, W*0.75]
    ))
    story.append(Spacer(1, 10))

    # 4.7 Supporting services
    story.append(Paragraph("4.7 Supporting Services", s['SubSection']))
    story.append(make_table(
        ["Service", "Purpose", "Replaces"],
        [
            ["Cloud Scheduler", "Trigger daily scraping pipeline at 00:00 UTC via HTTP", "node-cron (in-process)"],
            ["Secret Manager", "Store API keys, JWT secrets, DB credentials securely", ".env files"],
            ["Cloud Armor", "WAF, DDoS protection, IP allowlisting", "Application-level only"],
            ["IAM", "Service account permissions, least-privilege access", "N/A"],
            ["Cloud Logging", "Centralized application logs", "Console logging"],
            ["Cloud Monitoring", "Uptime checks, alerts, performance dashboards", "Manual monitoring"],
            ["Error Reporting", "Automatic error detection and grouping", "Manual log review"],
        ],
        col_widths=[W*0.22, W*0.48, W*0.30]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 5. INFRASTRUCTURE COST BREAKDOWN
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. Infrastructure Cost Breakdown", s['SectionTitle']))
    story.append(section_divider())

    # 5.1 One-time costs
    story.append(Paragraph("5.1 One-Time Costs (Setup &amp; Migration)", s['SubSection']))
    story.append(make_table(
        ["Item", "Cost", "Notes"],
        [
            ["GCP Project setup & IAM configuration", "$0", "Free — console setup"],
            ["Domain DNS migration", "$0", "Free — DNS record update"],
            ["Docker containerization for Cloud Run", "$0", "Development effort only"],
            ["Elasticsearch data migration", "~$50", "Data transfer + re-indexing compute time"],
            ["MongoDB Atlas migration", "~$50", "mongodump/mongorestore + data transfer"],
            ["SSL certificates", "$0", "Managed automatically by GCP/Firebase"],
            ["Cloud Storage bucket setup", "$0", "Free — lifecycle rules configuration"],
            ["Firebase Hosting setup", "$0", "Free — one-time CLI setup"],
            ["Testing & validation environment", "$50 – $150", "Temporary compute for parallel testing"],
            ["Total One-Time Cost", "$150 – $250", ""],
        ],
        col_widths=[W*0.42, W*0.15, W*0.43]
    ))
    story.append(Spacer(1, 12))

    # 5.2 Monthly — Option A
    story.append(Paragraph("5.2 Monthly Recurring Costs", s['SubSection']))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Option A: Gemini 2.0 Flash (Recommended — Lowest Cost)</b>", s['Highlight']))
    story.append(make_table(
        ["Service", "Configuration", "Monthly Cost"],
        [
            ["Cloud Run (Backend)", "1 vCPU, 1 GB RAM, min 1 instance, ~720 hrs/mo", "$40 – $65"],
            ["Vertex AI — Gemini 2.0 Flash", "~500K input + ~200K output tokens/month", "$10 – $25"],
            ["Vertex AI — Embeddings", "text-embedding-005, ~100K tokens/month", "$1 – $5"],
            ["Elasticsearch (Elastic Cloud)", "1 node, 4 GB RAM, GCP-hosted", "$95 – $120"],
            ["MongoDB Atlas (GCP)", "M10 Dedicated Cluster", "$57 – $80"],
            ["Cloud Storage", "~5 GB Standard, 7-day lifecycle", "$1 – $2"],
            ["Firebase Hosting", "Free tier (10 GB transfer/month)", "$0"],
            ["Cloud Scheduler", "3 scheduled jobs", "$0.30"],
            ["Secret Manager", "~15 secrets, 10K access ops", "$0.60"],
            ["Cloud Logging & Monitoring", "First 50 GB free", "$0 – $10"],
            ["Cloud Armor", "Basic security policy", "$5 – $10"],
            ["Network Egress", "~10 GB/month", "$1 – $5"],
            ["Total Monthly (Option A)", "", "$210 – $325"],
        ],
        col_widths=[W*0.32, W*0.42, W*0.26]
    ))
    story.append(Spacer(1, 10))

    # Option B
    story.append(Paragraph("<b>Option B: OpenAI API Direct (GPT-4o-mini)</b>", s['Highlight']))
    story.append(make_table(
        ["Service", "Configuration", "Monthly Cost"],
        [
            ["Cloud Run (Backend)", "1 vCPU, 1 GB RAM, min 1 instance", "$40 – $65"],
            ["OpenAI API — GPT-4o-mini", "~500K input + ~200K output tokens/month", "$15 – $40"],
            ["OpenAI API — Embeddings", "text-embedding-3-small, ~100K tokens/month", "$2 – $5"],
            ["Elasticsearch (Elastic Cloud)", "1 node, 4 GB RAM", "$95 – $120"],
            ["MongoDB Atlas (GCP)", "M10 Dedicated Cluster", "$57 – $80"],
            ["Other GCP services", "Storage, CDN, Scheduler, Secrets, Armor, Logging", "$12 – $30"],
            ["Total Monthly (Option B)", "", "$220 – $340"],
        ],
        col_widths=[W*0.32, W*0.42, W*0.26]
    ))
    story.append(Spacer(1, 10))

    # Option C
    story.append(Paragraph("<b>Option C: OpenAI on Vertex AI (GPT-4o-mini via Model Garden)</b>", s['Highlight']))
    story.append(make_table(
        ["Service", "Monthly Cost"],
        [
            ["All GCP infra (same as above)", "$200 – $300"],
            ["Vertex AI — GPT-4o-mini via Model Garden", "$20 – $50"],
            ["Total Monthly (Option C)", "$240 – $360"],
        ],
        col_widths=[W*0.65, W*0.35]
    ))
    story.append(Spacer(1, 12))

    # 5.3 Comparison summary
    story.append(Paragraph("5.3 Cost Comparison Summary", s['SubSection']))
    story.append(make_table(
        ["Scenario", "Monthly Cost", "Annual Cost"],
        [
            ["Option A: Gemini Flash (Recommended)", "$210 – $325", "$2,520 – $3,900"],
            ["Option B: OpenAI Direct", "$220 – $340", "$2,640 – $4,080"],
            ["Option C: OpenAI on Vertex", "$240 – $360", "$2,880 – $4,320"],
        ],
        col_widths=[W*0.42, W*0.29, W*0.29]
    ))
    story.append(Spacer(1, 10))

    # 5.4 Optimizations
    story.append(Paragraph("5.4 Cost Optimization Opportunities", s['SubSection']))
    story.append(make_table(
        ["Optimization", "Potential Savings"],
        [
            ["Committed Use Discounts (CUDs) for Cloud Run", "17–40% on compute costs"],
            ["MongoDB Atlas Serverless (M0/M2) instead of M10", "Save ~$50/month"],
            ["Vertex AI Vector Search instead of Elastic Cloud", "Save ~$60/month (requires code changes)"],
            ["Scale Cloud Run to zero during off-hours", "Save ~$15/month"],
            ["Cloud Run Jobs for scraping (pay only when running)", "Save ~$10/month"],
        ],
        col_widths=[W*0.58, W*0.42]
    ))
    story.append(Spacer(1, 6))
    story.append(make_highlight_box(
        "<b>With all optimizations applied:</b> ~$130 – $220/month",
        bg_color=HexColor("#e6f4ea"), border_color=ACCENT
    ))
    story.append(Spacer(1, 10))

    # Free tier
    story.append(Paragraph("5.5 GCP Free Tier Benefits", s['SubSection']))
    story.append(make_table(
        ["Service", "Free Allowance"],
        [
            ["Cloud Run", "2M requests/month, 360K vCPU-seconds, 180K GiB-seconds"],
            ["Cloud Storage", "5 GB Standard storage"],
            ["Firebase Hosting", "10 GB transfer/month, 1 GB storage"],
            ["Cloud Scheduler", "3 free jobs"],
            ["Secret Manager", "6 active secret versions, 10K access operations"],
            ["Cloud Logging", "50 GB/month"],
            ["Cloud Build", "120 build-minutes/day"],
        ],
        col_widths=[W*0.30, W*0.70]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 6. REQUIRED CODE CHANGES
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. Required Code Changes", s['SectionTitle']))
    story.append(section_divider())

    # 6.1 Summary
    story.append(Paragraph("6.1 Changes Summary", s['SubSection']))
    story.append(make_table(
        ["File / Module", "Change Type", "Effort"],
        [
            ["src/config/openai.js", "Replace Azure OpenAI SDK with Vertex AI / OpenAI SDK", "Medium"],
            ["src/services/embedding.service.js", "Update embedding API calls", "Low"],
            ["src/services/generation.service.js", "Update chat completion API calls", "Low"],
            ["src/config/azureBlob.js", "Replace with GCS client library", "Medium"],
            ["src/storage/azure.storage.js", "Rewrite for Cloud Storage", "Medium"],
            ["src/cron/cronjob.js", "Adapt for Cloud Scheduler HTTP trigger", "Low"],
            ["Dockerfile (new)", "Create container image for Cloud Run", "Low"],
            [".env / Secret Manager", "Update all environment variables", "Low"],
            ["Frontend/src/config/appConfig.js", "Update API URL to Cloud Run endpoint", "Trivial"],
            ["firebase.json (new)", "Firebase Hosting configuration", "Low"],
            ["cloudbuild.yaml (new)", "CI/CD pipeline for Cloud Build", "Low"],
        ],
        col_widths=[W*0.38, W*0.42, W*0.20]
    ))
    story.append(Spacer(1, 10))

    # 6.2 Detailed changes
    story.append(Paragraph("6.2 Detailed Code Changes", s['SubSection']))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>A. AI Service Migration (Option A — Gemini)</b>", s['Highlight']))
    story.append(Paragraph("File: <b>back-end/src/config/openai.js</b> — Replace Azure OpenAI SDK with Vertex AI:", s['BodyText2']))
    story.append(Paragraph(
        "// Before (Azure OpenAI)<br/>"
        "import { AzureOpenAI } from 'openai';<br/>"
        "const client = new AzureOpenAI({ endpoint, apiKey, apiVersion });<br/><br/>"
        "// After (Vertex AI - Gemini)<br/>"
        "import { VertexAI } from '@google-cloud/vertexai';<br/>"
        "const vertexAI = new VertexAI({ project: GCP_PROJECT_ID, location: GCP_REGION });<br/>"
        "const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash' });",
        s['CodeBlock']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("File: <b>back-end/src/services/generation.service.js</b> — Update completion calls:", s['BodyText2']))
    story.append(Paragraph(
        "// Before: client.chat.completions.create({ model, messages, temperature })<br/>"
        "// After:  model.generateContent({ contents, generationConfig: { temperature: 0.1 } })",
        s['CodeBlock']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>B. Storage Migration</b>", s['Highlight']))
    story.append(Paragraph("File: <b>back-end/src/storage/azure.storage.js → gcs.storage.js</b>", s['BodyText2']))
    story.append(Paragraph(
        "// Before: import { BlobServiceClient } from '@azure/storage-blob';<br/>"
        "// After:  import { Storage } from '@google-cloud/storage';<br/>"
        "//         const bucket = new Storage().bucket(process.env.GCS_BUCKET_NAME);<br/>"
        "//         await bucket.file(filename).save(data);",
        s['CodeBlock']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>C. Containerization (New Files)</b>", s['Highlight']))
    story.append(Paragraph("Create <b>back-end/Dockerfile</b> for Cloud Run deployment:", s['BodyText2']))
    story.append(Paragraph(
        "FROM node:20-slim<br/>"
        "RUN apt-get update &amp;&amp; apt-get install -y chromium<br/>"
        "ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium<br/>"
        "WORKDIR /app<br/>"
        "COPY package*.json ./<br/>"
        "RUN npm ci --production<br/>"
        "COPY . .<br/>"
        "EXPOSE 5000<br/>"
        "CMD [\"node\", \"src/server.js\"]",
        s['CodeBlock']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>D. Cloud Scheduler Integration</b>", s['Highlight']))
    story.append(Paragraph(
        "Replace in-process node-cron with an HTTP endpoint triggered by Cloud Scheduler:",
        s['BodyText2']))
    story.append(Paragraph(
        "// Add to server.js routes:<br/>"
        "app.post('/api/internal/trigger-scrape', authMiddleware, async (req, res) => {<br/>"
        "&nbsp;&nbsp;await runPipeline();<br/>"
        "&nbsp;&nbsp;res.status(200).json({ success: true });<br/>"
        "});",
        s['CodeBlock']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>E. New NPM Dependencies</b>", s['Highlight']))
    story.append(Paragraph(
        "// Remove:  @azure/storage-blob<br/>"
        "// Add (Option A):  @google-cloud/vertexai, @google-cloud/storage<br/>"
        "// Add (Option B):  @google-cloud/storage  (openai package already installed)",
        s['CodeBlock']))
    story.append(Spacer(1, 10))

    # 6.3 No changes needed
    story.append(Paragraph("6.3 Components Requiring No Changes", s['SubSection']))
    story.append(make_table(
        ["Component", "Reason"],
        [
            ["Elasticsearch client (@elastic/elasticsearch)", "Same client works with Elastic Cloud on GCP"],
            ["MongoDB / Mongoose ORM", "MongoDB Atlas works on any cloud; same connection string"],
            ["Socket.io (WebSocket)", "Cloud Run supports WebSockets natively"],
            ["Express routes, controllers, middleware", "No cloud-specific code"],
            ["Security middleware (Helmet, rate-limiting)", "Framework-level, fully cloud-agnostic"],
            ["Frontend React app", "Static build deploys anywhere"],
            ["Puppeteer scraper", "Works in Docker container with Chromium"],
            ["Guard service (prompt injection detection)", "Pure application logic, no cloud dependency"],
        ],
        col_widths=[W*0.42, W*0.58]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 7. MIGRATION TIMELINE
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Migration Timeline", s['SectionTitle']))
    story.append(section_divider())
    story.append(Paragraph(
        "The migration follows a four-phase approach, designed for zero-downtime transition. "
        "Total estimated effort: <b>5 – 8 working days</b>.",
        s['BodyText2']))
    story.append(Spacer(1, 8))

    # Phase 1
    story.append(Paragraph("<b>Phase 1: Infrastructure Setup (Day 1 – 2)</b>", s['Highlight']))
    story.append(make_table(
        ["Task", "Duration", "Details"],
        [
            ["Create GCP project & enable APIs", "2 hours", "Cloud Run, Vertex AI, Storage, Secrets, Scheduler"],
            ["Set up IAM & service accounts", "2 hours", "Least-privilege service account permissions"],
            ["Deploy MongoDB Atlas on GCP", "2 hours", "M10 cluster in europe-west1"],
            ["Set up Elastic Cloud on GCP", "2 hours", "1-node cluster with kNN enabled"],
            ["Create Cloud Storage bucket", "30 min", "Lifecycle rules for 7-day retention"],
            ["Configure Secret Manager", "1 hour", "Store all environment variables securely"],
            ["Set up Firebase Hosting", "30 min", "Connect to custom domain"],
        ],
        col_widths=[W*0.36, W*0.14, W*0.50]
    ))
    story.append(Spacer(1, 10))

    # Phase 2
    story.append(Paragraph("<b>Phase 2: Code Changes (Day 2 – 5)</b>", s['Highlight']))
    story.append(make_table(
        ["Task", "Duration", "Details"],
        [
            ["AI service migration (Vertex AI / OpenAI)", "4 – 6 hours", "Config + embedding + generation services"],
            ["Storage migration (Azure Blob → GCS)", "2 – 3 hours", "New storage service implementation"],
            ["Dockerize backend", "2 – 3 hours", "Dockerfile + local testing + optimization"],
            ["Cloud Scheduler integration", "1 – 2 hours", "HTTP trigger endpoint for scraping"],
            ["Environment variable migration", "1 hour", "Secret Manager integration"],
            ["Frontend config update", "30 min", "Update VITE_API_BASE_URL"],
        ],
        col_widths=[W*0.36, W*0.14, W*0.50]
    ))
    story.append(Spacer(1, 10))

    # Phase 3
    story.append(Paragraph("<b>Phase 3: Testing &amp; Validation (Day 5 – 7)</b>", s['Highlight']))
    story.append(make_table(
        ["Task", "Duration", "Details"],
        [
            ["Deploy to Cloud Run (staging)", "2 hours", "First deployment + debugging"],
            ["Test RAG pipeline end-to-end", "3 – 4 hours", "Verify embedding → search → generation"],
            ["Test scraping pipeline", "2 hours", "Run full scrape cycle on GCP"],
            ["Test WebSocket (admin dashboard)", "1 hour", "Verify real-time updates via Socket.io"],
            ["Load testing", "2 – 3 hours", "Verify auto-scaling behavior"],
            ["Deploy frontend to Firebase", "1 hour", "Verify CDN, routing, and SSL"],
        ],
        col_widths=[W*0.36, W*0.14, W*0.50]
    ))
    story.append(Spacer(1, 10))

    # Phase 4
    story.append(Paragraph("<b>Phase 4: Go Live (Day 7 – 8)</b>", s['Highlight']))
    story.append(make_table(
        ["Task", "Duration", "Details"],
        [
            ["DNS cutover", "1 hour", "Point domain to Firebase / Cloud Run"],
            ["Monitor for 24 hours", "Ongoing", "Watch logs, errors, latency metrics"],
            ["Decommission old infrastructure", "1 hour", "After successful validation period"],
        ],
        col_widths=[W*0.36, W*0.14, W*0.50]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 8. ARCHITECTURE DIAGRAMS
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("8. Architecture Diagrams", s['SectionTitle']))
    story.append(section_divider())

    story.append(Paragraph("8.1 Data Flow", s['SubSection']))
    flow_data = [
        [Paragraph("<b>Step</b>", s['TableHeader']),
         Paragraph("<b>Component</b>", s['TableHeader']),
         Paragraph("<b>Action</b>", s['TableHeader'])],
        [Paragraph("1", s['TableCell']), Paragraph("User (Browser)", s['TableCell']),
         Paragraph("Sends question via chat widget", s['TableCell'])],
        [Paragraph("2", s['TableCell']), Paragraph("Firebase Hosting", s['TableCell']),
         Paragraph("Serves React SPA, routes API calls to Cloud Run", s['TableCell'])],
        [Paragraph("3", s['TableCell']), Paragraph("Cloud Run (Backend)", s['TableCell']),
         Paragraph("Receives question, calls Vertex AI for embedding", s['TableCell'])],
        [Paragraph("4", s['TableCell']), Paragraph("Vertex AI (Embeddings)", s['TableCell']),
         Paragraph("Converts question to 768D/1536D vector", s['TableCell'])],
        [Paragraph("5", s['TableCell']), Paragraph("Elasticsearch", s['TableCell']),
         Paragraph("kNN search: finds top 5 relevant document chunks", s['TableCell'])],
        [Paragraph("6", s['TableCell']), Paragraph("Cloud Run (Backend)", s['TableCell']),
         Paragraph("Filters by relevance score (≥0.75), builds prompt", s['TableCell'])],
        [Paragraph("7", s['TableCell']), Paragraph("Vertex AI (Gemini Flash)", s['TableCell']),
         Paragraph("Generates answer from context + question (temp 0.1)", s['TableCell'])],
        [Paragraph("8", s['TableCell']), Paragraph("MongoDB Atlas", s['TableCell']),
         Paragraph("Logs session, question, answer, metadata", s['TableCell'])],
        [Paragraph("9", s['TableCell']), Paragraph("User (Browser)", s['TableCell']),
         Paragraph("Receives and displays answer", s['TableCell'])],
    ]
    flow_tbl = Table(flow_data, colWidths=[W*0.08, W*0.28, W*0.64])
    flow_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, ROW_ALT]),
    ]))
    story.append(flow_tbl)
    story.append(Spacer(1, 14))

    story.append(Paragraph("8.2 Security Architecture", s['SubSection']))
    sec_data = [
        [Paragraph("<b>Layer</b>", s['TableHeader']),
         Paragraph("<b>Service</b>", s['TableHeader']),
         Paragraph("<b>Protection</b>", s['TableHeader'])],
        [Paragraph("Edge", s['TableCell']), Paragraph("Cloud Armor", s['TableCell']),
         Paragraph("WAF rules, DDoS mitigation, geo-blocking", s['TableCell'])],
        [Paragraph("Transport", s['TableCell']), Paragraph("Cloud Load Balancer", s['TableCell']),
         Paragraph("TLS 1.3 termination, automatic SSL certificates", s['TableCell'])],
        [Paragraph("Application", s['TableCell']), Paragraph("Express Middleware", s['TableCell']),
         Paragraph("Helmet, rate limiting, CORS, input sanitization, NoSQL injection guard", s['TableCell'])],
        [Paragraph("AI Safety", s['TableCell']), Paragraph("Guard Service", s['TableCell']),
         Paragraph("Prompt injection detection, content filtering", s['TableCell'])],
        [Paragraph("Auth", s['TableCell']), Paragraph("JWT + bcrypt", s['TableCell']),
         Paragraph("HS256 tokens (25min), bcrypt-12 password hashing", s['TableCell'])],
        [Paragraph("Network", s['TableCell']), Paragraph("VPC Peering", s['TableCell']),
         Paragraph("Private connectivity: Cloud Run ↔ MongoDB ↔ Elasticsearch", s['TableCell'])],
        [Paragraph("Secrets", s['TableCell']), Paragraph("Secret Manager", s['TableCell']),
         Paragraph("IAM-controlled access, automatic rotation support", s['TableCell'])],
    ]
    sec_tbl = Table(sec_data, colWidths=[W*0.14, W*0.25, W*0.61])
    sec_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, ROW_ALT]),
    ]))
    story.append(sec_tbl)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 9. RECOMMENDATIONS
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("9. Recommendations", s['SectionTitle']))
    story.append(section_divider())

    story.append(Paragraph("9.1 Recommended Option: Option A (Gemini 2.0 Flash)", s['SubSection']))
    story.append(make_table(
        ["Factor", "Reasoning"],
        [
            ["Cost", "30–60% cheaper than GPT-4o-mini for comparable quality on RAG tasks"],
            ["Latency", "Lower latency when both AI and infrastructure are on GCP"],
            ["Data Residency", "All data stays within GCP Europe region"],
            ["Vendor Lock-in", "Moderate — can switch to OpenAI later with config change"],
            ["Quality", "Gemini 2.0 Flash is excellent for RAG tasks at this scale"],
        ],
        col_widths=[W*0.20, W*0.80]
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("9.2 If OpenAI Quality is Preferred: Option B", s['SubSection']))
    story.append(Paragraph("• Minimal code changes — just remove Azure wrapper and use standard OpenAI SDK", s['BulletCustom']))
    story.append(Paragraph("• Same model quality as current setup (GPT-4o-mini)", s['BulletCustom']))
    story.append(Paragraph("• Slightly higher AI costs but lower migration effort", s['BulletCustom']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("9.3 Additional Recommendations", s['SubSection']))
    story.append(Paragraph("1. <b>Start with MongoDB Atlas Shared (M0/M2)</b> — Free tier or $9/month is sufficient for initial load; upgrade later as needed", s['BulletCustom']))
    story.append(Paragraph("2. <b>Use Cloud Run min-instances=1</b> — Ensures WebSocket connections stay alive without cold starts", s['BulletCustom']))
    story.append(Paragraph("3. <b>Enable Cloud CDN</b> on the Cloud Run service for API response caching on GET endpoints", s['BulletCustom']))
    story.append(Paragraph("4. <b>Set up Cloud Build</b> for CI/CD — auto-deploy on git push to main branch", s['BulletCustom']))
    story.append(Paragraph("5. <b>Consider Vertex AI Vector Search</b> as future replacement for Elasticsearch — saves ~$60–100/month but requires code rewrite", s['BulletCustom']))
    story.append(Paragraph("6. <b>Implement structured logging</b> with Cloud Logging client for better observability", s['BulletCustom']))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # APPENDIX A
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("Appendix A: Environment Variables (GCP)", s['SectionTitle']))
    story.append(section_divider())
    story.append(make_table(
        ["Variable", "Required", "Default", "Purpose"],
        [
            ["GCP_PROJECT_ID", "✓", "—", "GCP project identifier"],
            ["GCP_REGION", "✓", "europe-west1", "GCP deployment region"],
            ["VERTEX_AI_MODEL", "✓ (Opt A)", "gemini-2.0-flash", "Chat model deployment"],
            ["VERTEX_EMBEDDING_MODEL", "✓ (Opt A)", "text-embedding-005", "Embedding model"],
            ["OPENAI_API_KEY", "✓ (Opt B)", "—", "OpenAI API key (if using Option B)"],
            ["MONGO_URI", "✓", "—", "MongoDB Atlas connection string"],
            ["ELASTIC_NODE", "✓", "—", "Elasticsearch endpoint URL"],
            ["ELASTIC_USERNAME", "○", "—", "Elasticsearch auth username"],
            ["ELASTIC_PASSWORD", "○", "—", "Elasticsearch auth password"],
            ["GCS_BUCKET_NAME", "✓", "—", "Cloud Storage bucket for backups"],
            ["JWT_SECRET", "✓", "—", "JWT signing key (32+ chars)"],
            ["ADMIN_EMAIL", "✓", "—", "Default admin email"],
            ["ADMIN_PASSWORD", "✓", "—", "Default admin password"],
            ["NODE_ENV", "○", "production", "Environment mode"],
            ["PORT", "○", "5000", "Backend server port"],
            ["ENABLE_CRON", "○", "false", "Enable in-process cron (use Cloud Scheduler instead)"],
            ["RAG_MIN_SCORE", "○", "0.75", "Minimum relevance score for search"],
            ["RAG_TOP_K", "○", "5", "Number of documents retrieved"],
        ],
        col_widths=[W*0.30, W*0.10, W*0.20, W*0.40]
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("✓ = Required &nbsp;&nbsp; ○ = Optional", s['SmallNote']))

    story.append(Spacer(1, 20))

    # ════════════════════════════════════════════════════════════════
    # APPENDIX B
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("Appendix B: GCP CLI Setup Commands", s['SectionTitle']))
    story.append(section_divider())

    story.append(Paragraph("<b>1. Create project and enable APIs:</b>", s['BodyText2']))
    story.append(Paragraph(
        "gcloud projects create unido-chatbot-prod<br/>"
        "gcloud services enable run.googleapis.com aiplatform.googleapis.com \\<br/>"
        "&nbsp;&nbsp;storage.googleapis.com secretmanager.googleapis.com \\<br/>"
        "&nbsp;&nbsp;cloudscheduler.googleapis.com cloudbuild.googleapis.com \\<br/>"
        "&nbsp;&nbsp;firebase.googleapis.com",
        s['CodeBlock']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>2. Deploy backend to Cloud Run:</b>", s['BodyText2']))
    story.append(Paragraph(
        "gcloud run deploy unido-chatbot --source . \\<br/>"
        "&nbsp;&nbsp;--region europe-west1 --min-instances 1 --max-instances 10 \\<br/>"
        "&nbsp;&nbsp;--memory 1Gi --cpu 1 --port 5000 --allow-unauthenticated",
        s['CodeBlock']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>3. Create Cloud Scheduler job:</b>", s['BodyText2']))
    story.append(Paragraph(
        "gcloud scheduler jobs create http daily-scrape \\<br/>"
        "&nbsp;&nbsp;--schedule='0 0 * * *' \\<br/>"
        "&nbsp;&nbsp;--uri='https://unido-chatbot-xxxxx.run.app/api/internal/trigger-scrape' \\<br/>"
        "&nbsp;&nbsp;--http-method=POST \\<br/>"
        "&nbsp;&nbsp;--oidc-service-account-email=scheduler-sa@unido-chatbot-prod.iam.gserviceaccount.com",
        s['CodeBlock']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>4. Create Cloud Storage bucket:</b>", s['BodyText2']))
    story.append(Paragraph(
        "gsutil mb -l europe-west1 gs://unido-chatbot-backups<br/>"
        "gsutil lifecycle set lifecycle.json gs://unido-chatbot-backups",
        s['CodeBlock']))

    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=10))
    story.append(Paragraph("— End of Document —", ParagraphStyle(
        'EndDoc', parent=s['BodyText2'], alignment=TA_CENTER, textColor=TEXT_SECONDARY, fontSize=10)))

    # ── Build PDF ───────────────────────────────────────────────────
    doc.build(story, onFirstPage=first_page_header, onLaterPages=header_footer)
    print(f"PDF generated successfully: {output_path}")
    return output_path


if __name__ == "__main__":
    build_pdf()
