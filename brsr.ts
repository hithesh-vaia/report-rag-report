// BRSR_questions.ts — Business Responsibility & Sustainability Report (SEBI)
// URL params that drive navigation: ?section=A&subsection=A_DETAILS&topic=corporate_identity
// Field mapping: section → URL section, subsection → URL subsection, topic → URL topic
import fs from "fs";
export type BRSRAnswerType =
  | "text"
  | "small_text"
  | "number"
  | "select"
  | "select_other"
  | "multi_select"
  | "radio"
  | "date"
  | "table_general"
  | "table_dynamic"
  | "matrix" // P1-P9 cross-principle table (Section B)
  | "section_header"
  | "url";

export interface BRSRColumn {
  header: string;
  label?: string;
  type: "text" | "number" | "select" | "total";
  options?: string[];
  sum_of?: string[];
  group?: string;
  subgroup?: string;
}

export interface MatrixRow {
  ref: string;
  label: string;
  type: "radio" | "text" | "url";
  options?: string[];
}

export interface BRSRQuestion {
  question_id: string;
  framework: string; // question_ref stored in DB e.g. "BRSR_A_Q1"
  section: "A" | "B" | "C"; // matches URL ?section=
  subsection: string; // matches URL ?subsection=  e.g. "A_DETAILS", "P1"
  topic: string; // matches URL ?topic=  e.g. "corporate_identity"
  question: string;
  guidance?: string;
  answer_type: BRSRAnswerType;
  options?: string[];
  columns?: BRSRColumn[];
  row_labels?: string[];
  matrix_rows?: MatrixRow[];
  mandatory?: boolean;
  sub_questions?: {
    question_id: string;
    framework: string;
    question: string;
    guidance?: string;
    answer_type: BRSRAnswerType;
    options?: string[];
    columns?: BRSRColumn[];
    row_labels?: string[];
    condition?: string;
    mandatory?: boolean;
  }[];
}

const PRINCIPLE_SUBSECTIONS = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
];

// Returns which subsections should be visible in the sidebar given the active subsection.
// Company Details and Policy & Governance are their own groups; P1-P9 share one group.
export function getBRSRGroupSubsections(activeSubsection: string): string[] {
  if (!activeSubsection) return [];
  if (activeSubsection === "A_DETAILS") return ["A_DETAILS"];
  if (activeSubsection === "B_POLICY") return ["B_POLICY"];
  if (PRINCIPLE_SUBSECTIONS.includes(activeSubsection))
    return PRINCIPLE_SUBSECTIONS;
  return [activeSubsection];
}

export const BRSR_SUBSECTION_LABELS: Record<string, string> = {
  A_DETAILS: "Company Details",
  B_POLICY: "Policy & Governance",
  P1: "P1 — Ethics & Transparency",
  P2: "P2 — Sustainable Products",
  P3: "P3 — Employee Wellbeing",
  P4: "P4 — Stakeholder Value",
  P5: "P5 — Human Rights",
  P6: "P6 — Environment",
  P7: "P7 — Policy Advocacy",
  P8: "P8 — Inclusive Growth",
  P9: "P9 — Consumer Value",
};

export const BRSR_TOPIC_LABELS: Record<string, string> = {
  corporate_identity: "Corporate Identity",
  products_services: "Products & Services",
  operations: "Operations",
  employees_workers: "Employees & Workers",
  holding_subsidiary: "Holding & Subsidiaries",
  csr_details: "CSR Details",
  transparency_disclosures: "Transparency & Disclosures",
  policy_overview: "Policy Overview (P1-P9)",
  governance_leadership: "Governance & Leadership",
  stakeholder_engagement: "Stakeholder Engagement",
  essential: "Essential Indicators",
  leadership: "Leadership Indicators",
};

// ---------------------------------------------------------------------------
// Shared column sets reused across Section A employee tables
// ---------------------------------------------------------------------------

const EMP_WORKER_COLS: BRSRColumn[] = [
  { header: "perm_male", label: "Male", type: "number", group: "Permanent" },
  {
    header: "perm_female",
    label: "Female",
    type: "number",
    group: "Permanent",
  },
  {
    header: "perm_total",
    label: "Total",
    type: "total",
    sum_of: ["perm_male", "perm_female"],
    group: "Permanent",
  },
  {
    header: "other_male",
    label: "Male",
    type: "number",
    group: "Other than Permanent",
  },
  {
    header: "other_female",
    label: "Female",
    type: "number",
    group: "Other than Permanent",
  },
  {
    header: "other_total",
    label: "Total",
    type: "total",
    sum_of: ["other_male", "other_female"],
    group: "Other than Permanent",
  },
  {
    header: "total_male",
    label: "Male",
    type: "total",
    sum_of: ["perm_male", "other_male"],
    group: "Total",
  },
  {
    header: "total_female",
    label: "Female",
    type: "total",
    sum_of: ["perm_female", "other_female"],
    group: "Total",
  },
  {
    header: "grand_total",
    label: "Total",
    type: "total",
    sum_of: ["perm_total", "other_total"],
    group: "Total",
  },
];

const DIFF_ABLED_COLS: BRSRColumn[] = [
  { header: "emp_male", label: "Male", type: "number", group: "Employees" },
  { header: "emp_female", label: "Female", type: "number", group: "Employees" },
  {
    header: "emp_total",
    label: "Total",
    type: "total",
    sum_of: ["emp_male", "emp_female"],
    group: "Employees",
  },
  { header: "wkr_male", label: "Male", type: "number", group: "Workers" },
  { header: "wkr_female", label: "Female", type: "number", group: "Workers" },
  {
    header: "wkr_total",
    label: "Total",
    type: "total",
    sum_of: ["wkr_male", "wkr_female"],
    group: "Workers",
  },
];

// ---------------------------------------------------------------------------
// BRSR Question Bank
// ---------------------------------------------------------------------------

export const BRSR_QUESTIONS: BRSRQuestion[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // SECTION A — GENERAL DISCLOSURES
  // ══════════════════════════════════════════════════════════════════════════

  // ── I. Corporate Identity ──────────────────────────────────────────────────

  {
    question_id: "brsr-a-001",
    framework: "BRSR_A_Q1",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Corporate Identity Number (CIN) of the Listed Entity",
    answer_type: "small_text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-002",
    framework: "BRSR_A_Q2",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Name of the Listed Entity",
    answer_type: "small_text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-003",
    framework: "BRSR_A_Q3",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Year of incorporation",
    answer_type: "number",
    mandatory: true,
  },
  {
    question_id: "brsr-a-004",
    framework: "BRSR_A_Q4",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Registered office address",
    answer_type: "text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-005",
    framework: "BRSR_A_Q5",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Corporate address (if different from registered address)",
    answer_type: "text",
  },
  {
    question_id: "brsr-a-006",
    framework: "BRSR_A_Q6",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "E-mail address",
    answer_type: "small_text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-007",
    framework: "BRSR_A_Q7",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Telephone number",
    answer_type: "small_text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-008",
    framework: "BRSR_A_Q8",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Website",
    answer_type: "small_text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-009",
    framework: "BRSR_A_Q9",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Financial year for which reporting is being done",
    guidance: "E.g. FY 2023-24 (April 2023 to March 2024)",
    answer_type: "small_text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-010",
    framework: "BRSR_A_Q10",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Stock Exchange(s) where shares are listed",
    answer_type: "multi_select",
    options: ["BSE", "NSE", "Both BSE & NSE"],
    mandatory: true,
  },
  {
    question_id: "brsr-a-011",
    framework: "BRSR_A_Q11",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Paid-up Capital (INR)",
    answer_type: "number",
    mandatory: true,
  },
  {
    question_id: "brsr-a-012",
    framework: "BRSR_A_Q12",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question:
      "Name and contact details of the person responsible for this BRSR report",
    guidance:
      "Include name, designation, email, and telephone of the nodal officer.",
    answer_type: "text",
    mandatory: true,
  },
  {
    question_id: "brsr-a-013",
    framework: "BRSR_A_Q13",
    section: "A",
    subsection: "A_DETAILS",
    topic: "corporate_identity",
    question: "Reporting boundary",
    guidance:
      "Are the disclosures under this report made on a standalone basis (entity only) or on a consolidated basis (entity and all subsidiaries)?",
    answer_type: "radio",
    options: ["Standalone", "Consolidated"],
    mandatory: true,
  },

  // ── II. Products / Services ────────────────────────────────────────────────

  {
    question_id: "brsr-a-014",
    framework: "BRSR_A_Q14",
    section: "A",
    subsection: "A_DETAILS",
    topic: "products_services",
    question: "Details of business activities contributing ≥ 10% of turnover",
    guidance:
      "List main business activities. Include NIC code and % of turnover for each.",
    answer_type: "table_dynamic",
    columns: [
      { header: "sno", label: "S.No", type: "number" },
      {
        header: "main_activity",
        label: "Description of Main Activity",
        type: "text",
      },
      { header: "biz_activity", label: "Business Activity", type: "text" },
      { header: "nic_code", label: "NIC Code", type: "text" },
      { header: "turnover_pct", label: "% of Turnover", type: "number" },
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-a-015",
    framework: "BRSR_A_Q15",
    section: "A",
    subsection: "A_DETAILS",
    topic: "products_services",
    question: "Products/Services sold by the entity",
    guidance:
      "Include NIC code and % contribution to turnover for the current financial year.",
    answer_type: "table_dynamic",
    columns: [
      { header: "sno", label: "S.No", type: "number" },
      { header: "product", label: "Product / Service", type: "text" },
      { header: "nic_code", label: "NIC Code", type: "text" },
      {
        header: "turnover_pct",
        label: "% Contribution to Turnover",
        type: "number",
      },
    ],
    mandatory: true,
  },

  // ── III. Operations ────────────────────────────────────────────────────────

  {
    question_id: "brsr-a-016",
    framework: "BRSR_A_Q16",
    section: "A",
    subsection: "A_DETAILS",
    topic: "operations",
    question:
      "Number of locations where plants and/or operations/offices are situated",
    answer_type: "table_general",
    columns: [
      { header: "plants", label: "Plants", type: "number", group: "National" },
      {
        header: "offices",
        label: "Offices",
        type: "number",
        group: "National",
      },
      {
        header: "nat_total",
        label: "Total",
        type: "total",
        sum_of: ["plants", "offices"],
        group: "National",
      },
      {
        header: "int_plants",
        label: "Plants",
        type: "number",
        group: "International",
      },
      {
        header: "int_offices",
        label: "Offices",
        type: "number",
        group: "International",
      },
      {
        header: "int_total",
        label: "Total",
        type: "total",
        sum_of: ["int_plants", "int_offices"],
        group: "International",
      },
    ],
    row_labels: ["Locations"],
    mandatory: true,
  },
  {
    question_id: "brsr-a-017",
    framework: "BRSR_A_Q17",
    section: "A",
    subsection: "A_DETAILS",
    topic: "operations",
    question:
      "Markets served by the entity — number of states and union territories",
    answer_type: "table_general",
    columns: [
      { header: "states_ut", label: "No. of States / UTs", type: "number" },
      { header: "districts", label: "No. of Districts", type: "number" },
      {
        header: "int_countries",
        label: "No. of Countries (International)",
        type: "number",
      },
    ],
    row_labels: ["Count"],
    sub_questions: [
      {
        question_id: "brsr-a-017a",
        framework: "BRSR_A_Q17a",
        question:
          "What is the contribution of exports as a percentage of total turnover?",
        answer_type: "number",
      },
      {
        question_id: "brsr-a-017b",
        framework: "BRSR_A_Q17b",
        question: "Briefly describe the types of customers served",
        guidance: "E.g. B2B, B2C, Government, Export",
        answer_type: "text",
      },
    ],
  },

  // ── IV. Employees & Workers ────────────────────────────────────────────────

  {
    question_id: "brsr-a-018",
    framework: "BRSR_A_Q18",
    section: "A",
    subsection: "A_DETAILS",
    topic: "employees_workers",
    question:
      "Details of employees and workers as at the end of the financial year",
    guidance:
      "Permanent = on direct payroll. 'Other than permanent' includes contractual, casual, daily wage, etc.",
    answer_type: "table_general",
    columns: EMP_WORKER_COLS,
    row_labels: ["Employees", "Workers"],
    mandatory: true,
  },
  {
    question_id: "brsr-a-019",
    framework: "BRSR_A_Q19",
    section: "A",
    subsection: "A_DETAILS",
    topic: "employees_workers",
    question: "Differently abled employees and workers",
    answer_type: "table_general",
    columns: DIFF_ABLED_COLS,
    row_labels: ["Permanent (D)", "Other than Permanent (D)"],
  },
  {
    question_id: "brsr-a-020",
    framework: "BRSR_A_Q20",
    section: "A",
    subsection: "A_DETAILS",
    topic: "employees_workers",
    question: "Participation/Inclusion/Representation of women",
    guidance:
      "Report on representation of women at Board level and senior management level.",
    answer_type: "table_general",
    columns: [
      { header: "total", label: "Total (A)", type: "number" },
      { header: "women", label: "No. of Females (B)", type: "number" },
      { header: "women_pct", label: "% (B/A)", type: "total", sum_of: [] },
    ],
    row_labels: [
      "Board of Directors",
      "Key Management Personnel",
      "Senior Management",
    ],
  },
  {
    question_id: "brsr-a-021",
    framework: "BRSR_A_Q21",
    section: "A",
    subsection: "A_DETAILS",
    topic: "employees_workers",
    question:
      "Turnover rate for permanent employees and workers (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "male_cy", label: "Male", type: "number", group: "Current FY" },
      {
        header: "female_cy",
        label: "Female",
        type: "number",
        group: "Current FY",
      },
      {
        header: "total_cy",
        label: "Total",
        type: "total",
        sum_of: ["male_cy", "female_cy"],
        group: "Current FY",
      },
      {
        header: "male_py",
        label: "Male",
        type: "number",
        group: "Previous FY",
      },
      {
        header: "female_py",
        label: "Female",
        type: "number",
        group: "Previous FY",
      },
      {
        header: "total_py",
        label: "Total",
        type: "total",
        sum_of: ["male_py", "female_py"],
        group: "Previous FY",
      },
    ],
    row_labels: ["Permanent Employees", "Permanent Workers"],
  },

  // ── V. Holding / Subsidiary / Associate Companies ─────────────────────────

  {
    question_id: "brsr-a-022",
    framework: "BRSR_A_Q22",
    section: "A",
    subsection: "A_DETAILS",
    topic: "holding_subsidiary",
    question:
      "Names of holding / subsidiary / associate companies including joint ventures",
    guidance:
      "Indicate whether the BRSR disclosures are made for that entity as well.",
    answer_type: "table_dynamic",
    columns: [
      { header: "sno", label: "S.No", type: "number" },
      { header: "name", label: "Name of the Company", type: "text" },
      {
        header: "type",
        label:
          "Indicate whether Holding / Subsidiary / Associate / Joint Venture",
        type: "select",
        options: ["Holding", "Subsidiary", "Associate", "Joint Venture"],
      },
      {
        header: "pct",
        label: "% of shares held by Listed Entity",
        type: "number",
      },
      {
        header: "brsr",
        label: "Does the entity indicate BRSR disclosures for this entity?",
        type: "select",
        options: ["Yes", "No"],
      },
    ],
  },

  // ── VI. CSR Details ────────────────────────────────────────────────────────

  {
    question_id: "brsr-a-023",
    framework: "BRSR_A_Q23",
    section: "A",
    subsection: "A_DETAILS",
    topic: "csr_details",
    question:
      "Is CSR applicable to your entity under Section 135 of the Companies Act, 2013?",
    answer_type: "radio",
    options: ["Yes", "No"],
    mandatory: true,
  },
  {
    question_id: "brsr-a-024",
    framework: "BRSR_A_Q24",
    section: "A",
    subsection: "A_DETAILS",
    topic: "csr_details",
    question: "Turnover (in INR)",
    guidance: "As per the latest audited financial statements",
    answer_type: "number",
    mandatory: true,
  },
  {
    question_id: "brsr-a-025",
    framework: "BRSR_A_Q25",
    section: "A",
    subsection: "A_DETAILS",
    topic: "csr_details",
    question: "Net worth (in INR)",
    guidance: "As per the latest audited financial statements",
    answer_type: "number",
    mandatory: true,
  },

  // ── VII. Transparency & Disclosures ───────────────────────────────────────

  {
    question_id: "brsr-a-026",
    framework: "BRSR_A_Q26",
    section: "A",
    subsection: "A_DETAILS",
    topic: "transparency_disclosures",
    question:
      "Complaints/Grievances on any of the principles (P1–P9) during the year",
    guidance:
      "Report all stakeholder groups with grievance mechanisms. Include number received, pending, and remarks.",
    answer_type: "table_general",
    columns: [
      {
        header: "mechanism",
        label: "Grievance Redressal Mechanism in Place (Yes/No)",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        header: "fy_number",
        label: "Number (Current FY)",
        type: "number",
        group: "FY 23-24",
      },
      {
        header: "fy_pending",
        label: "Pending (Current FY)",
        type: "number",
        group: "FY 23-24",
      },
      {
        header: "py_number",
        label: "Number (Previous FY)",
        type: "number",
        group: "FY 22-23",
      },
      {
        header: "py_pending",
        label: "Pending (Previous FY)",
        type: "number",
        group: "FY 22-23",
      },
      { header: "remarks", label: "Remarks", type: "text" },
    ],
    row_labels: [
      "Communities",
      "Investors (other than shareholders)",
      "Shareholders",
      "Employees and workers",
      "Customers",
      "Value Chain Partners",
      "Other (please specify)",
    ],
  },
  {
    question_id: "brsr-a-027",
    framework: "BRSR_A_Q27",
    section: "A",
    subsection: "A_DETAILS",
    topic: "transparency_disclosures",
    question:
      "Overview of the entity's material responsible business conduct issues",
    guidance:
      "Provide a brief summary of key ESG risks and opportunities, and any ongoing initiatives.",
    answer_type: "text",
  },
  {
    question_id: "brsr-a-028",
    framework: "BRSR_A_Q28",
    section: "A",
    subsection: "A_DETAILS",
    topic: "transparency_disclosures",
    question:
      "Overview of ESG ratings obtained by the entity during the current financial year",
    guidance: "Include rating agency, type of rating, and rating obtained.",
    answer_type: "table_dynamic",
    columns: [
      { header: "agency", label: "Rating Agency", type: "text" },
      { header: "type", label: "Type of Rating", type: "text" },
      { header: "rating", label: "Rating / Score", type: "text" },
      { header: "fy", label: "Financial Year", type: "text" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION B — MANAGEMENT & PROCESS DISCLOSURES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Policy Overview (P1-P9 Matrix) ────────────────────────────────────────

  {
    question_id: "brsr-b-001",
    framework: "BRSR_B_Q1",
    section: "B",
    subsection: "B_POLICY",
    topic: "policy_overview",
    question:
      "Policy and management processes — Does the entity have a policy/policies for each principle?",
    guidance:
      "For each of the 9 NGRBC principles, indicate whether a policy exists and whether it has been approved by the Board.",
    answer_type: "matrix",
    matrix_rows: [
      {
        ref: "has_policy",
        label: "Does the entity have a policy/policies for this principle?",
        type: "radio",
        options: ["Yes", "No"],
      },
      {
        ref: "board_approved",
        label: "Has the policy been approved by the Board?",
        type: "radio",
        options: ["Yes", "No", "N/A"],
      },
      {
        ref: "web_link",
        label: "Web link of the policy, if available",
        type: "url",
      },
      {
        ref: "translated",
        label: "Has the entity translated the policy into procedures?",
        type: "radio",
        options: ["Yes", "No", "In Progress"],
      },
      {
        ref: "value_chain",
        label: "Do the enlisted policies extend to your value chain partners?",
        type: "radio",
        options: ["Yes", "No", "Partially"],
      },
      {
        ref: "national_intl",
        label:
          "Name of the national and international codes/certifications/labels/standards adopted and mapped to this principle",
        type: "text",
      },
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-b-002",
    framework: "BRSR_B_Q2",
    section: "B",
    subsection: "B_POLICY",
    topic: "policy_overview",
    question:
      "If the entity has not indicated a policy for any principle, reason for not having a policy",
    guidance:
      "Specify reason: entity has decided not to cover this principle in its policy / entity is not at a stage where it finds itself in a position to formulate and implement the policies on specified principles (stage of business) / entity does not consider the principles material to its business / any other reason.",
    answer_type: "table_general",
    columns: [
      {
        header: "reason",
        label: "Reason",
        type: "select",
        options: [
          "Not applicable to our business",
          "Not at a stage to formulate policy",
          "Principle not material to our business",
          "Other",
        ],
      },
      { header: "remarks", label: "Remarks", type: "text" },
    ],
    row_labels: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"],
  },

  // ── Governance & Leadership ────────────────────────────────────────────────

  {
    question_id: "brsr-b-003",
    framework: "BRSR_B_Q3",
    section: "B",
    subsection: "B_POLICY",
    topic: "governance_leadership",
    question:
      "Statement by Director responsible for the Business Responsibility report",
    guidance:
      "Provide a brief statement by the Director responsible for this report, highlighting key initiatives and commitments.",
    answer_type: "text",
    mandatory: true,
  },
  {
    question_id: "brsr-b-004",
    framework: "BRSR_B_Q4",
    section: "B",
    subsection: "B_POLICY",
    topic: "governance_leadership",
    question:
      "Details of the highest authority responsible for implementation and oversight of the Business Responsibility policy",
    guidance: "Include designation and DIN/UID if applicable.",
    answer_type: "table_general",
    columns: [
      { header: "name", label: "Name", type: "text" },
      { header: "designation", label: "Designation", type: "text" },
      { header: "din", label: "DIN / UID", type: "text" },
    ],
    row_labels: ["Director responsible for BR"],
  },
  {
    question_id: "brsr-b-005",
    framework: "BRSR_B_Q5",
    section: "B",
    subsection: "B_POLICY",
    topic: "governance_leadership",
    question:
      "Does the entity have a specified Committee of the Board/Director responsible for the decision-making on sustainability related issues?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-b-005a",
        framework: "BRSR_B_Q5a",
        question: "If yes, provide details of the committee / person",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-b-006",
    framework: "BRSR_B_Q6",
    section: "B",
    subsection: "B_POLICY",
    topic: "governance_leadership",
    question: "Details of Review of NGRBCs by the entity",
    guidance:
      "Indicate who reviews performance against each principle and the frequency of such review.",
    answer_type: "table_general",
    columns: [
      { header: "subject", label: "Subject for Review", type: "text" },
      {
        header: "indicate",
        label:
          "Indicate whether review was undertaken by Director / Committee of the Board / Any other Committee",
        type: "select",
        options: ["Director", "Committee of the Board", "Any other Committee"],
      },
      {
        header: "frequency",
        label: "Frequency",
        type: "select",
        options: [
          "Annually",
          "Half Yearly",
          "Quarterly",
          "Any other (please specify)",
        ],
      },
    ],
    row_labels: [
      "Performance against above policies and follow-up action",
      "Compliance with statutory requirements of relevance to the principles, and, rectification of any non-compliances",
    ],
  },

  // ── Stakeholder Engagement ─────────────────────────────────────────────────

  {
    question_id: "brsr-b-007",
    framework: "BRSR_B_Q7",
    section: "B",
    subsection: "B_POLICY",
    topic: "stakeholder_engagement",
    question:
      "Has the entity carried out independent assessment/evaluation of the working of its policies by an external agency?",
    answer_type: "table_general",
    columns: [
      {
        header: "assessed",
        label: "Yes / No",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        header: "agency",
        label: "Name of External Agency (if yes)",
        type: "text",
      },
    ],
    row_labels: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"],
  },
  {
    question_id: "brsr-b-008",
    framework: "BRSR_B_Q8",
    section: "B",
    subsection: "B_POLICY",
    topic: "stakeholder_engagement",
    question:
      "If answer to question above is 'No', then provide reasons and plans to adopt",
    guidance:
      "Describe any plans to get policies independently assessed or reasons for not doing so.",
    answer_type: "text",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION C — PRINCIPLE-WISE PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════

  // ── P1: Ethics, Transparency & Accountability ──────────────────────────────

  {
    question_id: "brsr-c-p1-e-001",
    framework: "BRSR_C_P1_EI_Q1",
    section: "C",
    subsection: "P1",
    topic: "essential",
    question:
      "Percentage coverage by training and awareness programmes on any of the principles during the financial year",
    answer_type: "table_general",
    columns: [
      { header: "segment", label: "Segment", type: "text" },
      { header: "total", label: "Total (A)", type: "number" },
      { header: "covered", label: "No. Covered (B)", type: "number" },
      {
        header: "topics",
        label: "Topics / Principles Covered Under the Training",
        type: "text",
      },
    ],
    row_labels: [
      "Board of Directors",
      "Key Managerial Personnel",
      "Employees other than BoD & KMPs",
      "Workers",
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-c-p1-e-002",
    framework: "BRSR_C_P1_EI_Q2",
    section: "C",
    subsection: "P1",
    topic: "essential",
    question:
      "Details of fines / penalties / punishment / award / compounding fees / settlement amount paid in proceedings (by the entity or by directors / KMPs) with regulators / law enforcement agencies / judicial institutions, in the current financial year",
    guidance:
      "Include NGRBC principle, name of regulatory authority, amount in INR, brief of the case, enforcement action.",
    answer_type: "table_dynamic",
    columns: [
      { header: "principle", label: "NGRBC Principle", type: "text" },
      {
        header: "authority",
        label: "Name of Regulatory / Enforcement Agency",
        type: "text",
      },
      { header: "amount", label: "Amount (INR)", type: "number" },
      { header: "case_brief", label: "Brief of the Case", type: "text" },
      { header: "action", label: "Enforcement Action Taken", type: "text" },
    ],
    sub_questions: [
      {
        question_id: "brsr-c-p1-e-002a",
        framework: "BRSR_C_P1_EI_Q2a",
        question:
          "Of the above penalties, details of cases where appeal has been preferred",
        answer_type: "table_dynamic",
        columns: [
          { header: "principle", label: "NGRBC Principle", type: "text" },
          { header: "case_brief", label: "Case Details", type: "text" },
          { header: "authority", label: "Name of Authority", type: "text" },
          { header: "amount", label: "Amount (INR)", type: "number" },
          { header: "status", label: "Status", type: "text" },
        ],
      },
    ],
  },
  {
    question_id: "brsr-c-p1-e-003",
    framework: "BRSR_C_P1_EI_Q3",
    section: "C",
    subsection: "P1",
    topic: "essential",
    question: "Does the entity have an anti-corruption or anti-bribery policy?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p1-e-003a",
        framework: "BRSR_C_P1_EI_Q3a",
        question: "If yes, provide a web link to the policy",
        answer_type: "small_text",
        condition: "Yes",
      },
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-c-p1-e-004",
    framework: "BRSR_C_P1_EI_Q4",
    section: "C",
    subsection: "P1",
    topic: "essential",
    question:
      "Number of Directors/KMPs/employees/workers against whom disciplinary action was taken by any law enforcement agency for the charges of bribery/corruption (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "fy_count", label: "Current FY", type: "number" },
      { header: "py_count", label: "Previous FY", type: "number" },
    ],
    row_labels: ["Directors", "KMPs", "Employees", "Workers"],
  },
  {
    question_id: "brsr-c-p1-e-005",
    framework: "BRSR_C_P1_EI_Q5",
    section: "C",
    subsection: "P1",
    topic: "essential",
    question:
      "Details of complaints with regard to conflict of interest (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "fy_num", label: "Number (Current FY)", type: "number" },
      { header: "fy_remarks", label: "Remarks (Current FY)", type: "text" },
      { header: "py_num", label: "Number (Previous FY)", type: "number" },
      { header: "py_remarks", label: "Remarks (Previous FY)", type: "text" },
    ],
    row_labels: [
      "Complaints received in relation to issues of Conflict of Interest of the Directors",
      "Complaints received in relation to issues of Conflict of Interest of the KMPs",
    ],
  },
  {
    question_id: "brsr-c-p1-l-001",
    framework: "BRSR_C_P1_LI_Q1",
    section: "C",
    subsection: "P1",
    topic: "leadership",
    question:
      "Awareness programmes conducted for value chain partners on any of the principles during the financial year",
    answer_type: "table_dynamic",
    columns: [
      {
        header: "total_vcp",
        label: "Total Value Chain Partners (A)",
        type: "number",
      },
      {
        header: "covered",
        label: "No. of Partners Covered (B)",
        type: "number",
      },
      { header: "topics", label: "Topics / Principles Covered", type: "text" },
      { header: "remarks", label: "Remarks", type: "text" },
    ],
  },
  {
    question_id: "brsr-c-p1-l-002",
    framework: "BRSR_C_P1_LI_Q2",
    section: "C",
    subsection: "P1",
    topic: "leadership",
    question:
      "Does the entity have processes in place to avoid/manage conflict of interests involving members of the Board?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p1-l-002a",
        framework: "BRSR_C_P1_LI_Q2a",
        question: "If yes, provide details of the same",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },

  // ── P2: Safe & Sustainable Products ───────────────────────────────────────

  {
    question_id: "brsr-c-p2-e-001",
    framework: "BRSR_C_P2_EI_Q1",
    section: "C",
    subsection: "P2",
    topic: "essential",
    question:
      "Percentage of R&D and capital expenditure (capex) investments in specific technologies to improve the environmental and social impacts of product and processes to total R&D and capex investments made by the entity (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "fy_pct", label: "Current FY (%)", type: "number" },
      { header: "py_pct", label: "Previous FY (%)", type: "number" },
      {
        header: "details",
        label: "Details of Improvements in Environmental and Social Impacts",
        type: "text",
      },
    ],
    row_labels: ["R&D", "Capex"],
  },
  {
    question_id: "brsr-c-p2-e-002",
    framework: "BRSR_C_P2_EI_Q2",
    section: "C",
    subsection: "P2",
    topic: "essential",
    question:
      "Does the entity have procedures in place for sustainable sourcing?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p2-e-002a",
        framework: "BRSR_C_P2_EI_Q2a",
        question: "If yes, what percentage of inputs were sourced sustainably?",
        answer_type: "number",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p2-e-003",
    framework: "BRSR_C_P2_EI_Q3",
    section: "C",
    subsection: "P2",
    topic: "essential",
    question:
      "Describe the processes in place to safely reclaim your products for reuse, recycling, and disposing at the end of life",
    guidance:
      "For Plastics (including packaging), E-waste, Hazardous waste, and Other waste.",
    answer_type: "table_dynamic",
    columns: [
      { header: "category", label: "Category", type: "text" },
      { header: "reclaimed_pct", label: "% Reclaimed", type: "number" },
      { header: "process", label: "Process Description", type: "text" },
    ],
  },
  {
    question_id: "brsr-c-p2-e-004",
    framework: "BRSR_C_P2_EI_Q4",
    section: "C",
    subsection: "P2",
    topic: "essential",
    question:
      "Whether Extended Producer Responsibility (EPR) is applicable to the entity's activities?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p2-e-004a",
        framework: "BRSR_C_P2_EI_Q4a",
        question:
          "If yes, whether the waste collection plan is in line with the EPR plan submitted to Pollution Control Boards?",
        answer_type: "radio",
        options: ["Yes", "No"],
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p2-l-001",
    framework: "BRSR_C_P2_LI_Q1",
    section: "C",
    subsection: "P2",
    topic: "leadership",
    question:
      "Has the entity conducted Life Cycle Perspective / Assessments (LCA) for any of its products (for manufacturing industry) / its services (for service industry)?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p2-l-001a",
        framework: "BRSR_C_P2_LI_Q1a",
        question:
          "If yes, provide details of products/services for which LCA was conducted and percentage of total turnover covered",
        answer_type: "table_dynamic",
        columns: [
          { header: "nic_code", label: "NIC Code", type: "text" },
          { header: "product", label: "Product / Service", type: "text" },
          {
            header: "turnover_pct",
            label: "% of Total Turnover",
            type: "number",
          },
          { header: "boundary", label: "Boundary for the LCA", type: "text" },
          {
            header: "whether_third_party",
            label: "Whether Conducted by Independent External Agency (Y/N)",
            type: "select",
            options: ["Yes", "No"],
          },
          {
            header: "result",
            label: "Result communicated in public domain (Y/N)?",
            type: "select",
            options: ["Yes", "No"],
          },
        ],
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p2-l-002",
    framework: "BRSR_C_P2_LI_Q2",
    section: "C",
    subsection: "P2",
    topic: "leadership",
    question:
      "If there are any significant social or environmental concerns and/or risks arising from production or disposal of your products/services, as identified in the Life Cycle Perspective/Assessments (LCA) or through any other means, briefly describe the same along with action taken to mitigate the same",
    answer_type: "table_dynamic",
    columns: [
      { header: "product", label: "Product / Service", type: "text" },
      {
        header: "concern",
        label: "Description of the risk / concern",
        type: "text",
      },
      { header: "action", label: "Action Taken", type: "text" },
    ],
  },

  // ── P3: Employee Wellbeing ─────────────────────────────────────────────────

  {
    question_id: "brsr-c-p3-e-001",
    framework: "BRSR_C_P3_EI_Q1",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Details of measures for the well-being of employees — % of employees covered by health insurance, accident insurance, maternity / paternity benefits, day care facilities",
    answer_type: "table_general",
    columns: [
      {
        header: "total",
        label: "Total Employees (A)",
        type: "number",
        group: "Health Insurance",
      },
      {
        header: "hi_covered",
        label: "Covered (B)",
        type: "number",
        group: "Health Insurance",
      },
      {
        header: "hi_pct",
        label: "% (B/A)",
        type: "total",
        sum_of: [],
        group: "Health Insurance",
      },
      {
        header: "ai_covered",
        label: "Covered",
        type: "number",
        group: "Accident Insurance",
      },
      {
        header: "mat_covered",
        label: "Covered",
        type: "number",
        group: "Maternity Benefits",
      },
      {
        header: "pat_covered",
        label: "Covered",
        type: "number",
        group: "Paternity Benefits",
      },
      {
        header: "day_covered",
        label: "Covered",
        type: "number",
        group: "Day Care Facilities",
      },
    ],
    row_labels: [
      "Permanent — Male",
      "Permanent — Female",
      "Other than Permanent — Male",
      "Other than Permanent — Female",
    ],
  },
  {
    question_id: "brsr-c-p3-e-002",
    framework: "BRSR_C_P3_EI_Q2",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Details of measures for the well-being of workers — % of workers covered",
    answer_type: "table_general",
    columns: [
      {
        header: "total",
        label: "Total Workers (A)",
        type: "number",
        group: "Health Insurance",
      },
      {
        header: "hi_covered",
        label: "Covered (B)",
        type: "number",
        group: "Health Insurance",
      },
      {
        header: "hi_pct",
        label: "% (B/A)",
        type: "total",
        sum_of: [],
        group: "Health Insurance",
      },
      {
        header: "ai_covered",
        label: "Covered",
        type: "number",
        group: "Accident Insurance",
      },
      {
        header: "pf_covered",
        label: "Covered",
        type: "number",
        group: "PF / Retirement Benefits",
      },
      {
        header: "gratuity",
        label: "Covered",
        type: "number",
        group: "Gratuity",
      },
      { header: "esic", label: "Covered", type: "number", group: "ESI" },
    ],
    row_labels: [
      "Permanent — Male",
      "Permanent — Female",
      "Other than Permanent — Male",
      "Other than Permanent — Female",
    ],
  },
  {
    question_id: "brsr-c-p3-e-003",
    framework: "BRSR_C_P3_EI_Q3",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Accessibility of workplaces — are any of your plants/offices identified as inaccessible to differently abled persons?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p3-e-003a",
        framework: "BRSR_C_P3_EI_Q3a",
        question:
          "If yes, briefly describe the steps being taken to address this",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p3-e-004",
    framework: "BRSR_C_P3_EI_Q4",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Does the entity have an equal opportunity policy as per the Rights of Persons with Disabilities Act, 2016?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p3-e-004a",
        framework: "BRSR_C_P3_EI_Q4a",
        question: "If yes, provide a web link to the policy",
        answer_type: "small_text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p3-e-005",
    framework: "BRSR_C_P3_EI_Q5",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Return to work and retention rates of permanent employees and workers that took parental leave (current FY)",
    answer_type: "table_general",
    columns: [
      {
        header: "took_leave",
        label: "Took Parental Leave",
        type: "number",
        group: "Employees",
      },
      {
        header: "returned",
        label: "Returned to Work",
        type: "number",
        group: "Employees",
      },
      {
        header: "retained",
        label: "Retained After 12 Months",
        type: "number",
        group: "Employees",
      },
      {
        header: "w_took_leave",
        label: "Took Parental Leave",
        type: "number",
        group: "Workers",
      },
      {
        header: "w_returned",
        label: "Returned to Work",
        type: "number",
        group: "Workers",
      },
      {
        header: "w_retained",
        label: "Retained After 12 Months",
        type: "number",
        group: "Workers",
      },
    ],
    row_labels: ["Male", "Female", "Total"],
  },
  {
    question_id: "brsr-c-p3-e-006",
    framework: "BRSR_C_P3_EI_Q6",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Is there a mechanism available for employees and workers to report work related grievances including sexual harassment?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p3-e-006a",
        framework: "BRSR_C_P3_EI_Q6a",
        question: "If yes, provide details of the mechanism",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p3-e-007",
    framework: "BRSR_C_P3_EI_Q7",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Details of safety related incidents during the current and previous financial year",
    answer_type: "table_general",
    columns: [
      { header: "emp_fy", label: "Current FY — Employees", type: "number" },
      { header: "emp_py", label: "Previous FY — Employees", type: "number" },
      { header: "wkr_fy", label: "Current FY — Workers", type: "number" },
      { header: "wkr_py", label: "Previous FY — Workers", type: "number" },
    ],
    row_labels: [
      "Lost Time Injury Frequency Rate (LTIFR) per million man hours worked",
      "Total recordable work-related injuries",
      "No. of fatalities",
      "High consequence work-related injury or ill-health (excluding fatalities)",
    ],
  },
  {
    question_id: "brsr-c-p3-e-008",
    framework: "BRSR_C_P3_EI_Q8",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Number of complaints on working conditions and health & safety made by employees and workers (current and previous FY)",
    answer_type: "table_general",
    columns: [
      {
        header: "fy_filed",
        label: "Filed (Current FY)",
        type: "number",
        group: "Employees",
      },
      {
        header: "fy_pending",
        label: "Pending (Current FY)",
        type: "number",
        group: "Employees",
      },
      {
        header: "py_filed",
        label: "Filed (Previous FY)",
        type: "number",
        group: "Employees",
      },
      {
        header: "py_pending",
        label: "Pending (Previous FY)",
        type: "number",
        group: "Employees",
      },
      {
        header: "wfy_filed",
        label: "Filed (Current FY)",
        type: "number",
        group: "Workers",
      },
      {
        header: "wfy_pending",
        label: "Pending (Current FY)",
        type: "number",
        group: "Workers",
      },
      {
        header: "wpy_filed",
        label: "Filed (Previous FY)",
        type: "number",
        group: "Workers",
      },
      {
        header: "wpy_pending",
        label: "Pending (Previous FY)",
        type: "number",
        group: "Workers",
      },
    ],
    row_labels: ["Working Conditions", "Health & Safety"],
  },
  {
    question_id: "brsr-c-p3-e-009",
    framework: "BRSR_C_P3_EI_Q9",
    section: "C",
    subsection: "P3",
    topic: "essential",
    question:
      "Assessments for the year — % of plants and offices assessed (own assessment / external)",
    answer_type: "table_general",
    columns: [
      {
        header: "pct",
        label: "% of Plants and Offices Assessed",
        type: "number",
      },
    ],
    row_labels: ["Health and Safety practices", "Working Conditions"],
  },
  {
    question_id: "brsr-c-p3-l-001",
    framework: "BRSR_C_P3_LI_Q1",
    section: "C",
    subsection: "P3",
    topic: "leadership",
    question:
      "Does the entity extend any life insurance or any compensatory package in the event of death of an employee (Y/N)?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p3-l-001a",
        framework: "BRSR_C_P3_LI_Q1a",
        question: "Provide details",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p3-l-002",
    framework: "BRSR_C_P3_LI_Q2",
    section: "C",
    subsection: "P3",
    topic: "leadership",
    question:
      "Provide the measures undertaken by the entity to ensure that statutory dues have been deducted and deposited by the value chain partners",
    answer_type: "text",
  },

  // ── P4: Stakeholder Value ──────────────────────────────────────────────────

  {
    question_id: "brsr-c-p4-e-001",
    framework: "BRSR_C_P4_EI_Q1",
    section: "C",
    subsection: "P4",
    topic: "essential",
    question:
      "Describe the processes for identifying key stakeholder groups of the entity",
    answer_type: "text",
    mandatory: true,
  },
  {
    question_id: "brsr-c-p4-e-002",
    framework: "BRSR_C_P4_EI_Q2",
    section: "C",
    subsection: "P4",
    topic: "essential",
    question:
      "List stakeholder groups identified as key for your entity and the frequency of engagement with each group",
    answer_type: "table_dynamic",
    columns: [
      { header: "group", label: "Stakeholder Group", type: "text" },
      {
        header: "identified",
        label: "Whether identified as Vulnerable & Marginalised Group (Y/N)",
        type: "select",
        options: ["Yes", "No"],
      },
      { header: "channels", label: "Channels of Communication", type: "text" },
      {
        header: "frequency",
        label: "Frequency of Engagement",
        type: "select",
        options: ["Annually", "Half-yearly", "Quarterly", "Ongoing", "Ad hoc"],
      },
      {
        header: "purpose",
        label: "Purpose and Scope of Engagement including Key Topics",
        type: "text",
      },
    ],
    mandatory: true,
  },

  // ── P5: Human Rights ──────────────────────────────────────────────────────

  {
    question_id: "brsr-c-p5-e-001",
    framework: "BRSR_C_P5_EI_Q1",
    section: "C",
    subsection: "P5",
    topic: "essential",
    question:
      "Employees and workers who have been provided training on human rights issues and policies",
    answer_type: "table_general",
    columns: [
      {
        header: "total",
        label: "Total (A)",
        type: "number",
        group: "Current FY",
      },
      {
        header: "trained",
        label: "Trained (B)",
        type: "number",
        group: "Current FY",
      },
      {
        header: "pct",
        label: "% (B/A)",
        type: "total",
        sum_of: [],
        group: "Current FY",
      },
      {
        header: "p_total",
        label: "Total (A)",
        type: "number",
        group: "Previous FY",
      },
      {
        header: "p_trained",
        label: "Trained (B)",
        type: "number",
        group: "Previous FY",
      },
      {
        header: "p_pct",
        label: "% (B/A)",
        type: "total",
        sum_of: [],
        group: "Previous FY",
      },
    ],
    row_labels: [
      "Permanent Employees",
      "Other than Permanent Employees",
      "Permanent Workers",
      "Other than Permanent Workers",
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-c-p5-e-002",
    framework: "BRSR_C_P5_EI_Q2",
    section: "C",
    subsection: "P5",
    topic: "essential",
    question:
      "Details of minimum wages paid to employees and workers (as % of total employees/workers)",
    guidance:
      "Breakdown by Permanent and Other than Permanent; Male and Female.",
    answer_type: "table_general",
    columns: [
      {
        header: "total",
        label: "Total (A)",
        type: "number",
        group: "Permanent",
      },
      {
        header: "eq_above",
        label: "Equal to Minimum Wage (B)",
        type: "number",
        group: "Permanent",
      },
      {
        header: "eq_pct",
        label: "% (B/A)",
        type: "total",
        sum_of: [],
        group: "Permanent",
      },
      {
        header: "o_total",
        label: "Total (A)",
        type: "number",
        group: "Other than Permanent",
      },
      {
        header: "o_eq",
        label: "Equal to Minimum Wage (B)",
        type: "number",
        group: "Other than Permanent",
      },
      {
        header: "o_pct",
        label: "% (B/A)",
        type: "total",
        sum_of: [],
        group: "Other than Permanent",
      },
    ],
    row_labels: [
      "Employees — Male",
      "Employees — Female",
      "Workers — Male",
      "Workers — Female",
    ],
  },
  {
    question_id: "brsr-c-p5-e-003",
    framework: "BRSR_C_P5_EI_Q3",
    section: "C",
    subsection: "P5",
    topic: "essential",
    question: "Details of remuneration / salary / wages — median and mean",
    answer_type: "table_general",
    columns: [
      {
        header: "median",
        label: "Median Remuneration / Salary / Wages (INR)",
        type: "number",
      },
      {
        header: "mean",
        label: "Mean Remuneration / Salary / Wages (INR)",
        type: "number",
      },
    ],
    row_labels: [
      "Board of Directors (Male)",
      "Board of Directors (Female)",
      "KMP (Male)",
      "KMP (Female)",
      "Senior Management (Male)",
      "Senior Management (Female)",
      "Employees other than above (Male)",
      "Employees other than above (Female)",
      "Workers (Male)",
      "Workers (Female)",
    ],
  },
  {
    question_id: "brsr-c-p5-e-004",
    framework: "BRSR_C_P5_EI_Q4",
    section: "C",
    subsection: "P5",
    topic: "essential",
    question:
      "Do you have a focal point (Designated Person/Committee) responsible for addressing human rights impacts or issues caused or contributed to by the business?",
    answer_type: "radio",
    options: ["Yes", "No"],
  },
  {
    question_id: "brsr-c-p5-e-005",
    framework: "BRSR_C_P5_EI_Q5",
    section: "C",
    subsection: "P5",
    topic: "essential",
    question: "Number of Complaints on the following (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "fy_filed", label: "Filed (Current FY)", type: "number" },
      { header: "fy_pending", label: "Pending (Current FY)", type: "number" },
      { header: "py_filed", label: "Filed (Previous FY)", type: "number" },
      { header: "py_pending", label: "Pending (Previous FY)", type: "number" },
      { header: "remarks", label: "Remarks", type: "text" },
    ],
    row_labels: [
      "Sexual Harassment",
      "Discrimination at workplace",
      "Child Labour",
      "Forced Labour / Involuntary Labour",
      "Wages",
      "Other human rights related issues",
    ],
  },
  {
    question_id: "brsr-c-p5-e-006",
    framework: "BRSR_C_P5_EI_Q6",
    section: "C",
    subsection: "P5",
    topic: "essential",
    question: "Assessments for the year (% of plants / offices assessed)",
    answer_type: "table_general",
    columns: [
      {
        header: "pct",
        label: "% of Plants and Offices Assessed",
        type: "number",
      },
    ],
    row_labels: [
      "Child labour",
      "Forced/involuntary labour",
      "Sexual harassment",
      "Discrimination at workplace",
      "Wages",
    ],
  },
  {
    question_id: "brsr-c-p5-l-001",
    framework: "BRSR_C_P5_LI_Q1",
    section: "C",
    subsection: "P5",
    topic: "leadership",
    question:
      "Details of a business process being modified / introduced as a result of addressing human rights grievances/complaints",
    answer_type: "text",
  },
  {
    question_id: "brsr-c-p5-l-002",
    framework: "BRSR_C_P5_LI_Q2",
    section: "C",
    subsection: "P5",
    topic: "leadership",
    question:
      "Details of the scope and coverage of any Human Rights due-diligence conducted",
    answer_type: "text",
  },
  {
    question_id: "brsr-c-p5-l-003",
    framework: "BRSR_C_P5_LI_Q3",
    section: "C",
    subsection: "P5",
    topic: "leadership",
    question:
      "Is the premise/office of the entity accessible to differently abled visitors, as per the requirements of the Rights of Persons with Disabilities Act, 2016?",
    answer_type: "radio",
    options: ["Yes", "No", "Partially"],
  },

  // ── P6: Environment ────────────────────────────────────────────────────────

  {
    question_id: "brsr-c-p6-e-001",
    framework: "BRSR_C_P6_EI_Q1",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question:
      "Details of total energy consumption (in Joules or multiples) and energy intensity",
    guidance:
      "Report energy from coal, oil, gas, other non-renewable, and total renewable sources. Also report intensity per rupee of turnover.",
    answer_type: "table_general",
    columns: [
      { header: "fy_value", label: "Current FY", type: "number" },
      { header: "py_value", label: "Previous FY", type: "number" },
    ],
    row_labels: [
      "From coal and lignite",
      "From oil and gas",
      "From nuclear energy",
      "Other non-renewable sources",
      "Total energy consumption from non-renewable sources (A)",
      "Total energy consumption from renewable sources (B)",
      "Total energy consumption (A+B)",
      "Energy intensity per rupee of turnover (GJ/INR crore)",
      "Energy intensity (optional metric)",
    ],
  },
  {
    question_id: "brsr-c-p6-e-002",
    framework: "BRSR_C_P6_EI_Q2",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question:
      "Does the entity have any sites / offices identified as designated consumers (DCs) under the Performance, Achieve and Trade (PAT) Scheme of the Government of India?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p6-e-002a",
        framework: "BRSR_C_P6_EI_Q2a",
        question:
          "If yes, disclose whether targets set under the PAT scheme have been achieved",
        answer_type: "radio",
        options: ["Yes", "No"],
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p6-e-003",
    framework: "BRSR_C_P6_EI_Q3",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question:
      "Provide details of the following disclosures related to water — in kilolitres (KL)",
    answer_type: "table_general",
    columns: [
      { header: "fy_value", label: "Current FY", type: "number" },
      { header: "py_value", label: "Previous FY", type: "number" },
    ],
    row_labels: [
      "Water withdrawal from surface water",
      "Water withdrawal from groundwater",
      "Water withdrawal from third party water",
      "Water withdrawal from seawater / desalinated water",
      "Total water withdrawal (KL)",
      "Total water consumption (KL)",
      "Water intensity per rupee of turnover (KL/INR crore)",
      "Water intensity (optional metric)",
    ],
  },
  {
    question_id: "brsr-c-p6-e-004",
    framework: "BRSR_C_P6_EI_Q4",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question:
      "Has the entity implemented a mechanism for Zero Liquid Discharge?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p6-e-004a",
        framework: "BRSR_C_P6_EI_Q4a",
        question: "If yes, provide details and coverage of ZLD",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p6-e-005",
    framework: "BRSR_C_P6_EI_Q5",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question:
      "Provide details of air emissions (in metric tonnes) other than GHG emissions",
    answer_type: "table_general",
    columns: [
      { header: "fy_value", label: "Current FY", type: "number" },
      { header: "py_value", label: "Previous FY", type: "number" },
    ],
    row_labels: [
      "NOx",
      "SOx",
      "Particulate matter (PM)",
      "Persistent Organic Pollutants (POP)",
      "Volatile Organic Compounds (VOC)",
      "Hazardous Air Pollutants (HAP)",
      "Others",
    ],
  },
  {
    question_id: "brsr-c-p6-e-006",
    framework: "BRSR_C_P6_EI_Q6",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question: "Greenhouse gas emissions (in metric tonnes of CO2 equivalent)",
    answer_type: "table_general",
    columns: [
      { header: "fy_value", label: "Current FY", type: "number" },
      { header: "py_value", label: "Previous FY", type: "number" },
    ],
    row_labels: [
      "Total Scope 1 emissions",
      "Total Scope 2 emissions",
      "Total Scope 1 and Scope 2 emissions per rupee of turnover",
      "Total Scope 3 emissions (optional)",
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-c-p6-e-007",
    framework: "BRSR_C_P6_EI_Q7",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question:
      "Does the entity have any project related to reducing GHG emission? If Yes, then provide details",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p6-e-007a",
        framework: "BRSR_C_P6_EI_Q7a",
        question:
          "If yes, describe the project(s) and their impact on GHG reduction",
        answer_type: "text",
        condition: "Yes",
      },
    ],
  },
  {
    question_id: "brsr-c-p6-e-008",
    framework: "BRSR_C_P6_EI_Q8",
    section: "C",
    subsection: "P6",
    topic: "essential",
    question: "Provide details related to waste management (in metric tonnes)",
    answer_type: "table_general",
    columns: [
      { header: "fy_value", label: "Current FY", type: "number" },
      { header: "py_value", label: "Previous FY", type: "number" },
    ],
    row_labels: [
      "Plastic waste (A)",
      "E-waste (B)",
      "Bio-medical waste (C)",
      "Construction and demolition waste (D)",
      "Battery waste (E)",
      "Radioactive waste (F)",
      "Other Hazardous waste (G)",
      "Other Non-hazardous waste (H)",
      "Total waste generated (A+B+C+D+E+F+G+H)",
      "Total waste recovered through recycling",
      "Total waste recovered through reuse",
      "Total waste otherwise recovered",
      "Total waste disposed in landfill",
      "Total waste incinerated",
      "Total waste in other disposal operations",
    ],
  },
  {
    question_id: "brsr-c-p6-l-001",
    framework: "BRSR_C_P6_LI_Q1",
    section: "C",
    subsection: "P6",
    topic: "leadership",
    question:
      "If the entity has operations/offices in/around ecologically sensitive areas (such as national parks, wildlife sanctuaries, biosphere reserves, wetlands, biodiversity hotspots, forests, coastal regulation zones etc.) where environmental approvals/clearances are required, please specify details",
    answer_type: "table_dynamic",
    columns: [
      {
        header: "location",
        label: "Location of Operations / Offices",
        type: "text",
      },
      {
        header: "eco_area",
        label: "Type of Ecologically Sensitive Area",
        type: "text",
      },
      {
        header: "clearance",
        label: "Environmental Approval / Clearance Required (Y/N)",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        header: "status",
        label: "Whether Environmental Approval/Clearance Obtained (Y/N)",
        type: "select",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    question_id: "brsr-c-p6-l-002",
    framework: "BRSR_C_P6_LI_Q2",
    section: "C",
    subsection: "P6",
    topic: "leadership",
    question:
      "Details of environmental impact assessments of projects undertaken by the entity based on applicable laws, in the current financial year",
    answer_type: "table_dynamic",
    columns: [
      {
        header: "name",
        label: "Name and Brief Details of Project",
        type: "text",
      },
      { header: "eia_required", label: "EIA Notification No.", type: "text" },
      { header: "date", label: "Date", type: "text" },
      {
        header: "conducted_by",
        label: "Whether Conducted by Independent External Agency",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        header: "public",
        label: "Results Communicated in Public Domain",
        type: "select",
        options: ["Yes", "No"],
      },
      { header: "web_link", label: "Relevant Web Link", type: "text" },
    ],
  },

  // ── P7: Policy Advocacy ────────────────────────────────────────────────────

  {
    question_id: "brsr-c-p7-e-001",
    framework: "BRSR_C_P7_EI_Q1",
    section: "C",
    subsection: "P7",
    topic: "essential",
    question:
      "Number of affiliations with trade and industry chambers / associations",
    answer_type: "number",
    mandatory: true,
  },
  {
    question_id: "brsr-c-p7-e-002",
    framework: "BRSR_C_P7_EI_Q2",
    section: "C",
    subsection: "P7",
    topic: "essential",
    question:
      "List the top 10 trade and industry chambers / associations that the entity is a member of / is affiliated to",
    answer_type: "table_dynamic",
    columns: [
      { header: "sno", label: "S.No", type: "number" },
      {
        header: "name",
        label: "Name of Trade / Industry Chambers / Association",
        type: "text",
      },
      {
        header: "scope",
        label: "Scope of Engagement",
        type: "select",
        options: ["National", "State", "International"],
      },
    ],
  },
  {
    question_id: "brsr-c-p7-l-001",
    framework: "BRSR_C_P7_LI_Q1",
    section: "C",
    subsection: "P7",
    topic: "leadership",
    question:
      "Provide details of public policy positions advocated by the entity",
    answer_type: "table_dynamic",
    columns: [
      { header: "topic", label: "Public Policy Advocated", type: "text" },
      {
        header: "method",
        label: "Method Resorted to such as Direct / Indirect Advocacy",
        type: "text",
      },
      { header: "web_link", label: "Web Link / Source", type: "text" },
      {
        header: "frequency",
        label: "Frequency of Engagement",
        type: "select",
        options: ["Quarterly", "Half Yearly", "Annually", "Ongoing"],
      },
      {
        header: "stakeholders",
        label: "Whether Information Available in Public Domain (Y/N)",
        type: "select",
        options: ["Yes", "No"],
      },
    ],
  },

  // ── P8: Inclusive Growth & Equitable Development ──────────────────────────

  {
    question_id: "brsr-c-p8-e-001",
    framework: "BRSR_C_P8_EI_Q1",
    section: "C",
    subsection: "P8",
    topic: "essential",
    question:
      "Details of Social Impact Assessments (SIA) of projects undertaken by the entity based on applicable laws in the current financial year",
    answer_type: "table_dynamic",
    columns: [
      {
        header: "name",
        label: "Name and Brief Details of Project",
        type: "text",
      },
      { header: "sia_no", label: "SIA Notification No.", type: "text" },
      { header: "date", label: "Date of Notification", type: "text" },
      {
        header: "conducted_by",
        label: "Whether Conducted by Independent External Agency (Y/N)",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        header: "public",
        label: "Results Communicated in Public Domain (Y/N)",
        type: "select",
        options: ["Yes", "No"],
      },
      { header: "web_link", label: "Relevant Web Link", type: "text" },
    ],
  },
  {
    question_id: "brsr-c-p8-e-002",
    framework: "BRSR_C_P8_EI_Q2",
    section: "C",
    subsection: "P8",
    topic: "essential",
    question:
      "Provide information on project(s) for which ongoing Rehabilitation and Resettlement (R&R) is being undertaken by your entity",
    answer_type: "table_dynamic",
    columns: [
      { header: "name", label: "Name of Project", type: "text" },
      {
        header: "state",
        label: "State / District in which project is located",
        type: "text",
      },
      {
        header: "displaced",
        label: "No. of Project Affected Families (PAFs)",
        type: "number",
      },
      { header: "r_and_r", label: "% of PAFs covered by R&R", type: "number" },
      {
        header: "amounts",
        label: "Amounts paid to PAFs in the FY (INR)",
        type: "number",
      },
    ],
  },
  {
    question_id: "brsr-c-p8-e-003",
    framework: "BRSR_C_P8_EI_Q3",
    section: "C",
    subsection: "P8",
    topic: "essential",
    question:
      "Describe the mechanisms to receive and redress grievances of the community",
    answer_type: "text",
    mandatory: true,
  },
  {
    question_id: "brsr-c-p8-e-004",
    framework: "BRSR_C_P8_EI_Q4",
    section: "C",
    subsection: "P8",
    topic: "essential",
    question:
      "Percentage of input material (raw materials or goods/services purchased) sourced from suppliers",
    answer_type: "table_general",
    columns: [
      { header: "fy_pct", label: "Current FY (%)", type: "number" },
      { header: "py_pct", label: "Previous FY (%)", type: "number" },
    ],
    row_labels: [
      "Directly sourced from MSMEs / small producers",
      "Sourced directly from within the district and neighbouring districts",
    ],
  },
  {
    question_id: "brsr-c-p8-l-001",
    framework: "BRSR_C_P8_LI_Q1",
    section: "C",
    subsection: "P8",
    topic: "leadership",
    question:
      "Provide details of actions taken to mitigate any negative social impacts identified in the Social Impact Assessments",
    answer_type: "table_dynamic",
    columns: [
      {
        header: "impact",
        label: "Details of Negative Social Impact Identified",
        type: "text",
      },
      { header: "action", label: "Corrective Action Taken", type: "text" },
    ],
  },
  {
    question_id: "brsr-c-p8-l-002",
    framework: "BRSR_C_P8_LI_Q2",
    section: "C",
    subsection: "P8",
    topic: "leadership",
    question:
      "Details of CSR projects undertaken by the entity in designated aspirational districts as identified by government bodies",
    answer_type: "table_dynamic",
    columns: [
      { header: "state", label: "State", type: "text" },
      { header: "district", label: "Aspirational District", type: "text" },
      { header: "amount", label: "Amount Spent (INR)", type: "number" },
    ],
  },

  // ── P9: Consumer Value ─────────────────────────────────────────────────────

  {
    question_id: "brsr-c-p9-e-001",
    framework: "BRSR_C_P9_EI_Q1",
    section: "C",
    subsection: "P9",
    topic: "essential",
    question:
      "Describe the mechanisms in place to receive and respond to consumer complaints and feedback",
    answer_type: "text",
    mandatory: true,
  },
  {
    question_id: "brsr-c-p9-e-002",
    framework: "BRSR_C_P9_EI_Q2",
    section: "C",
    subsection: "P9",
    topic: "essential",
    question:
      "Turnover of products and/or services as a percentage of net turnover — products/services with information on safe and responsible usage",
    answer_type: "table_general",
    columns: [
      { header: "fy_pct", label: "Current FY (%)", type: "number" },
      { header: "py_pct", label: "Previous FY (%)", type: "number" },
    ],
    row_labels: [
      "Provided with information about safe and responsible usage (A)",
      "Subjected to recalls for safety reasons (B)",
    ],
  },
  {
    question_id: "brsr-c-p9-e-003",
    framework: "BRSR_C_P9_EI_Q3",
    section: "C",
    subsection: "P9",
    topic: "essential",
    question:
      "Number of consumer complaints in respect of the following (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "fy_received", label: "Received (Current FY)", type: "number" },
      { header: "fy_pending", label: "Pending (Current FY)", type: "number" },
      {
        header: "py_received",
        label: "Received (Previous FY)",
        type: "number",
      },
      { header: "py_pending", label: "Pending (Previous FY)", type: "number" },
      { header: "remarks", label: "Remarks", type: "text" },
    ],
    row_labels: [
      "Data privacy",
      "Advertising",
      "Cyber-security",
      "Delivery of essential services",
      "Restrictive Trade Practices",
      "Unfair Trade Practices",
      "Other",
    ],
  },
  {
    question_id: "brsr-c-p9-e-004",
    framework: "BRSR_C_P9_EI_Q4",
    section: "C",
    subsection: "P9",
    topic: "essential",
    question:
      "Details of instances of product recalls on account of safety issues (current and previous FY)",
    answer_type: "table_general",
    columns: [
      { header: "fy_count", label: "Current FY", type: "number" },
      { header: "py_count", label: "Previous FY", type: "number" },
      { header: "reasons", label: "Reasons for Recall", type: "text" },
    ],
    row_labels: ["Voluntary recalls", "Forced recalls"],
  },
  {
    question_id: "brsr-c-p9-e-005",
    framework: "BRSR_C_P9_EI_Q5",
    section: "C",
    subsection: "P9",
    topic: "essential",
    question:
      "Does the entity have a framework / policy on cyber security and risks related to data privacy?",
    answer_type: "radio",
    options: ["Yes", "No"],
    sub_questions: [
      {
        question_id: "brsr-c-p9-e-005a",
        framework: "BRSR_C_P9_EI_Q5a",
        question: "If yes, provide a web link of the policy",
        answer_type: "small_text",
        condition: "Yes",
      },
    ],
    mandatory: true,
  },
  {
    question_id: "brsr-c-p9-e-006",
    framework: "BRSR_C_P9_EI_Q6",
    section: "C",
    subsection: "P9",
    topic: "essential",
    question:
      "Provide details of any corrective actions taken or underway on issues relating to advertising, and delivery of essential services; cyber security and data privacy of customers; re-occurrence of instances of product recalls; penalty / action taken by regulatory authorities on safety of products / services",
    answer_type: "text",
  },
  {
    question_id: "brsr-c-p9-l-001",
    framework: "BRSR_C_P9_LI_Q1",
    section: "C",
    subsection: "P9",
    topic: "leadership",
    question:
      "Channels / platforms where information on products and services of the entity can be accessed (provide web link, if available)",
    answer_type: "text",
  },
  {
    question_id: "brsr-c-p9-l-002",
    framework: "BRSR_C_P9_LI_Q2",
    section: "C",
    subsection: "P9",
    topic: "leadership",
    question:
      "Steps taken to inform and educate consumers about safe and responsible usage of products and/or services",
    answer_type: "text",
  },
  {
    question_id: "brsr-c-p9-l-003",
    framework: "BRSR_C_P9_LI_Q3",
    section: "C",
    subsection: "P9",
    topic: "leadership",
    question:
      "Mechanisms in place to inform consumers of any risk of disruption/discontinuation of essential services",
    answer_type: "text",
  },
  {
    question_id: "brsr-c-p9-l-004",
    framework: "BRSR_C_P9_LI_Q4",
    section: "C",
    subsection: "P9",
    topic: "leadership",
    question:
      "Does the entity display product information on the product over and above what is mandated as per local laws?",
    answer_type: "radio",
    options: ["Yes", "No", "N/A"],
    sub_questions: [
      {
        question_id: "brsr-c-p9-l-004a",
        framework: "BRSR_C_P9_LI_Q4a",
        question: "If yes, provide details; if no, provide reason",
        answer_type: "text",
      },
    ],
  },
];

fs.writeFile(
  "BRSR_Questions.json",
  JSON.stringify(BRSR_QUESTIONS, null, 2),
  "utf8",
  (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("JSON file exported successfully!");
    }
  },
);
