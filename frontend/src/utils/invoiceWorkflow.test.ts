import { describe, expect, it } from "vitest";
import {
  getInvoiceWorkflowStage,
  type InvoiceWorkflowRecord,
} from "./invoiceWorkflow";

const base = (overrides: Partial<InvoiceWorkflowRecord> = {}): InvoiceWorkflowRecord => ({
  status: "draft",
  payment_method: "cash",
  due_amount: 0,
  cash_manager_approved_at: null,
  final_review_approved_at: null,
  student_signed_at: null,
  customer_profile_submitted_at: null,
  super_admin_approved_at: null,
  ...overrides,
});

describe("getInvoiceWorkflowStage — cash invoices", () => {
  it("status approved always short-circuits to approved", () => {
    expect(getInvoiceWorkflowStage(base({ status: "approved" }))).toBe("approved");
  });

  it("freshly created, cash provided, unsigned → cash_review (not not_signed)", () => {
    expect(getInvoiceWorkflowStage(base())).toBe("cash_review");
  });

  it("cash reviewed, final review pending → final_review", () => {
    expect(
      getInvoiceWorkflowStage(base({ cash_manager_approved_at: "2026-01-01" })),
    ).toBe("final_review");
  });

  it("both reviews cleared, due > 0, unsigned → due (priority over not_signed)", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "2026-01-01",
          final_review_approved_at: "2026-01-02",
          due_amount: 400,
        }),
      ),
    ).toBe("due");
  });

  it("both reviews cleared, due > 0, signed → due (priority over approved)", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "2026-01-01",
          final_review_approved_at: "2026-01-02",
          due_amount: 400,
          student_signed_at: "2026-01-03",
        }),
      ),
    ).toBe("due");
  });

  it("both reviews cleared, no due, unsigned → not_signed", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "2026-01-01",
          final_review_approved_at: "2026-01-02",
          due_amount: 0,
        }),
      ),
    ).toBe("not_signed");
  });

  it("both reviews cleared, no due, signed → approved", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "2026-01-01",
          final_review_approved_at: "2026-01-02",
          due_amount: 0,
          student_signed_at: "2026-01-03",
        }),
      ),
    ).toBe("approved");
  });

  it("a cash due instalment resets both reviews, sending it back to cash_review", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: null,
          final_review_approved_at: null,
          due_amount: 300,
          student_signed_at: "2026-01-03",
        }),
      ),
    ).toBe("cash_review");
  });
});

describe("getInvoiceWorkflowStage — non-cash invoices (unchanged)", () => {
  const nonCash = (overrides: Partial<InvoiceWorkflowRecord> = {}) =>
    base({ payment_method: "bkash", cash_review_required: false, ...overrides });

  it("unsigned → not_signed", () => {
    expect(getInvoiceWorkflowStage(nonCash())).toBe("not_signed");
  });

  it("signed, due > 0 → due", () => {
    expect(
      getInvoiceWorkflowStage(nonCash({ student_signed_at: "2026-01-01", due_amount: 200 })),
    ).toBe("due");
  });

  it("signed, no due → final_review (backend normally auto-approves synchronously)", () => {
    expect(
      getInvoiceWorkflowStage(nonCash({ student_signed_at: "2026-01-01", due_amount: 0 })),
    ).toBe("final_review");
  });

  it("status approved → approved", () => {
    expect(getInvoiceWorkflowStage(nonCash({ status: "approved" }))).toBe("approved");
  });
});

describe("spec examples A-D", () => {
  it("Example A — cash, unsigned, no due, reviews cleared → Not Signed", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "t",
          final_review_approved_at: "t",
          due_amount: 0,
          student_signed_at: null,
        }),
      ),
    ).toBe("not_signed");
  });

  it("Example B — cash, unsigned, due exists, reviews cleared → Due", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "t",
          final_review_approved_at: "t",
          due_amount: 400,
          student_signed_at: null,
        }),
      ),
    ).toBe("due");
  });

  it("Example C — cash, signed, no due, reviews cleared → Approved", () => {
    expect(
      getInvoiceWorkflowStage(
        base({
          cash_manager_approved_at: "t",
          final_review_approved_at: "t",
          due_amount: 0,
          student_signed_at: "t",
        }),
      ),
    ).toBe("approved");
  });

  it("Example D — partial cash payment settles to Due, then a new cash due payment reopens Cash Review", () => {
    // After initial cash review + final review with due still outstanding.
    const midway = base({
      cash_manager_approved_at: "t1",
      final_review_approved_at: "t2",
      due_amount: 3000,
    });
    expect(getInvoiceWorkflowStage(midway)).toBe("due");

    // Remaining due paid by cash: backend nulls both review timestamps.
    const afterCashDuePayment = base({
      cash_manager_approved_at: null,
      final_review_approved_at: null,
      due_amount: 0,
    });
    expect(getInvoiceWorkflowStage(afterCashDuePayment)).toBe("cash_review");

    // Reviewed again, unsigned → Not Signed.
    const reviewedUnsigned = base({
      cash_manager_approved_at: "t3",
      final_review_approved_at: "t4",
      due_amount: 0,
      student_signed_at: null,
    });
    expect(getInvoiceWorkflowStage(reviewedUnsigned)).toBe("not_signed");

    // Reviewed again, signed → Approved.
    const reviewedSigned = base({
      cash_manager_approved_at: "t3",
      final_review_approved_at: "t4",
      due_amount: 0,
      student_signed_at: "t5",
    });
    expect(getInvoiceWorkflowStage(reviewedSigned)).toBe("approved");
  });
});
