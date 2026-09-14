import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  DocumentAcceptanceStatus,
  DocumentStatus,
  DocumentType,
  Vault1Document,
} from "../../types/document";

const DOCUMENT_COLLECTION =
  "documents";

const DOCUMENT_TYPES: DocumentType[] = [
  "TERMS",
  "RISK_DISCLOSURE",
  "AGREEMENT",
  "KYC",
  "STRATEGY_DISCLOSURE",
  "FEE_SCHEDULE",
  "STATEMENT",
  "TRANSACTION_HISTORY",
  "OTHER",
];

const DOCUMENT_STATUSES: DocumentStatus[] = [
  "DRAFT",
  "ISSUED",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
];

const ACCEPTANCE_STATUSES: DocumentAcceptanceStatus[] = [
  "NOT_REQUIRED",
  "PENDING",
  "ACCEPTED",
  "DECLINED",
];

function validateDocumentType(
  type: DocumentType
) {
  if (!DOCUMENT_TYPES.includes(type)) {
    throw new Error(
      "Invalid document type."
    );
  }
}

function validateDocumentStatus(
  status: DocumentStatus
) {
  if (!DOCUMENT_STATUSES.includes(status)) {
    throw new Error(
      "Invalid document status."
    );
  }
}

function validateAcceptanceStatus(
  status: DocumentAcceptanceStatus
) {
  if (
    !ACCEPTANCE_STATUSES.includes(status)
  ) {
    throw new Error(
      "Invalid acceptance status."
    );
  }
}

export async function createDocument({
  userId,
  investorId,
  investorCode,
  investorName,
  investorEmail,
  title,
  description = "",
  type,
  status = "DRAFT",
  version = "1.0",
  documentUrl = "",
  storagePath = "",
  issueDate,
  expiryDate,
  acceptanceStatus = "NOT_REQUIRED",
  issuedBy = "",
  notes = "",
}: {
  userId: string;
  investorId: string;
  investorCode: string;
  investorName: string;
  investorEmail: string;
  title: string;
  description?: string;
  type: DocumentType;
  status?: DocumentStatus;
  version?: string;
  documentUrl?: string;
  storagePath?: string;
  issueDate?: string;
  expiryDate?: string;
  acceptanceStatus?: DocumentAcceptanceStatus;
  issuedBy?: string;
  notes?: string;
}) {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  if (!investorId) {
    throw new Error(
      "Investor ID is required."
    );
  }

  if (!title.trim()) {
    throw new Error(
      "Document title is required."
    );
  }

  if (!version.trim()) {
    throw new Error(
      "Document version is required."
    );
  }

  validateDocumentType(type);
  validateDocumentStatus(status);
  validateAcceptanceStatus(
    acceptanceStatus
  );

  const documentData = {
    userId,

    investorId,
    investorCode:
      investorCode.trim(),
    investorName:
      investorName.trim(),
    investorEmail:
      investorEmail
        .trim()
        .toLowerCase(),

    title: title.trim(),
    description:
      description.trim(),

    type,
    status,

    version: version.trim(),

    ...(documentUrl.trim()
      ? {
          documentUrl:
            documentUrl.trim(),
        }
      : {}),

    ...(storagePath.trim()
      ? {
          storagePath:
            storagePath.trim(),
        }
      : {}),

    ...(issueDate
      ? {
          issueDate,
        }
      : {}),

    ...(expiryDate
      ? {
          expiryDate,
        }
      : {}),

    acceptanceStatus,

    ...(issuedBy.trim()
      ? {
          issuedBy:
            issuedBy.trim(),
        }
      : {}),

    ...(notes.trim()
      ? {
          notes: notes.trim(),
        }
      : {}),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const documentRef =
    await addDoc(
      collection(
        db,
        DOCUMENT_COLLECTION
      ),
      documentData
    );

  return documentRef.id;
}

export async function getDocuments(
  userId: string
): Promise<Vault1Document[]> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const documentsQuery =
    query(
      collection(
        db,
        DOCUMENT_COLLECTION
      ),
      where(
        "userId",
        "==",
        userId
      )
    );

  const snapshot =
    await getDocs(
      documentsQuery
    );

  const documents =
    snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as Vault1Document[];

  documents.sort((a, b) => {
    const aTime =
      a.createdAt?.toMillis?.() ??
      (a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : 0);

    const bTime =
      b.createdAt?.toMillis?.() ??
      (b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : 0);

    return bTime - aTime;
  });

  return documents;
}

export async function getInvestorDocuments(
  userId: string,
  investorId: string
): Promise<Vault1Document[]> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  if (!investorId) {
    throw new Error(
      "Investor ID is required."
    );
  }

  const documentsQuery =
    query(
      collection(
        db,
        DOCUMENT_COLLECTION
      ),
      where(
        "userId",
        "==",
        userId
      ),
      where(
        "investorId",
        "==",
        investorId
      )
    );

  const snapshot =
    await getDocs(
      documentsQuery
    );

  const documents =
    snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as Vault1Document[];

  documents.sort((a, b) => {
    const aTime =
      a.createdAt?.toMillis?.() ??
      0;

    const bTime =
      b.createdAt?.toMillis?.() ??
      0;

    return bTime - aTime;
  });

  return documents;
}

export async function updateDocument({
  documentId,
  title,
  description,
  type,
  status,
  version,
  documentUrl,
  storagePath,
  issueDate,
  expiryDate,
  acceptanceStatus,
  issuedBy,
  notes,
}: {
  documentId: string;
  title?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  version?: string;
  documentUrl?: string;
  storagePath?: string;
  issueDate?: string;
  expiryDate?: string;
  acceptanceStatus?: DocumentAcceptanceStatus;
  issuedBy?: string;
  notes?: string;
}) {
  if (!documentId) {
    throw new Error(
      "Document ID is required."
    );
  }

  if (
    title !== undefined &&
    !title.trim()
  ) {
    throw new Error(
      "Document title cannot be empty."
    );
  }

  if (
    version !== undefined &&
    !version.trim()
  ) {
    throw new Error(
      "Document version cannot be empty."
    );
  }

  if (type !== undefined) {
    validateDocumentType(type);
  }

  if (status !== undefined) {
    validateDocumentStatus(status);
  }

  if (
    acceptanceStatus !== undefined
  ) {
    validateAcceptanceStatus(
      acceptanceStatus
    );
  }

  const updateData: Record<
    string,
    any
  > = {
    updatedAt:
      serverTimestamp(),
  };

  if (title !== undefined) {
    updateData.title =
      title.trim();
  }

  if (
    description !== undefined
  ) {
    updateData.description =
      description.trim();
  }

  if (type !== undefined) {
    updateData.type = type;
  }

  if (status !== undefined) {
    updateData.status =
      status;
  }

  if (version !== undefined) {
    updateData.version =
      version.trim();
  }

  if (
    documentUrl !== undefined
  ) {
    updateData.documentUrl =
      documentUrl.trim();
  }

  if (
    storagePath !== undefined
  ) {
    updateData.storagePath =
      storagePath.trim();
  }

  if (issueDate !== undefined) {
    updateData.issueDate =
      issueDate;
  }

  if (expiryDate !== undefined) {
    updateData.expiryDate =
      expiryDate;
  }

  if (
    acceptanceStatus !==
    undefined
  ) {
    updateData.acceptanceStatus =
      acceptanceStatus;

    if (
      acceptanceStatus ===
      "ACCEPTED"
    ) {
      updateData.acceptedAt =
        serverTimestamp();
    }
  }

  if (issuedBy !== undefined) {
    updateData.issuedBy =
      issuedBy.trim();
  }

  if (notes !== undefined) {
    updateData.notes =
      notes.trim();
  }

  await updateDoc(
    doc(
      db,
      DOCUMENT_COLLECTION,
      documentId
    ),
    updateData
  );
}

export async function issueDocument(
  documentId: string,
  issueDate = new Date()
    .toISOString()
    .slice(0, 10)
) {
  await updateDocument({
    documentId,
    status: "ISSUED",
    issueDate,
  });
}

export async function acceptDocument(
  documentId: string
) {
  await updateDocument({
    documentId,
    status: "ACCEPTED",
    acceptanceStatus:
      "ACCEPTED",
  });
}

export async function expireDocument(
  documentId: string
) {
  await updateDocument({
    documentId,
    status: "EXPIRED",
  });
}

export async function revokeDocument(
  documentId: string
) {
  await updateDocument({
    documentId,
    status: "REVOKED",
  });
}

export function getDocumentTypeLabel(
  type: DocumentType
): string {
  switch (type) {
    case "TERMS":
      return "Terms & Conditions";

    case "RISK_DISCLOSURE":
      return "Risk Disclosure";

    case "AGREEMENT":
      return "Agreement";

    case "KYC":
      return "KYC";

    case "STRATEGY_DISCLOSURE":
      return "Strategy Disclosure";

    case "FEE_SCHEDULE":
      return "Fee Schedule";

    case "STATEMENT":
      return "Statement";

    case "TRANSACTION_HISTORY":
      return "Transaction History";

    case "OTHER":
      return "Other";

    default:
      return type;
  }
}

export function getDocumentStatusLabel(
  status: DocumentStatus
): string {
  switch (status) {
    case "DRAFT":
      return "DRAFT";

    case "ISSUED":
      return "ISSUED";

    case "ACCEPTED":
      return "ACCEPTED";

    case "EXPIRED":
      return "EXPIRED";

    case "REVOKED":
      return "REVOKED";

    default:
      return status;
  }
}

export function getAcceptanceLabel(
  status: DocumentAcceptanceStatus
): string {
  switch (status) {
    case "NOT_REQUIRED":
      return "NOT REQUIRED";

    case "PENDING":
      return "PENDING";

    case "ACCEPTED":
      return "ACCEPTED";

    case "DECLINED":
      return "DECLINED";

    default:
      return status;
  }
}

export function calculateDocumentSummary(
  documents: Vault1Document[]
) {
  const issued =
    documents.filter(
      (document) =>
        document.status === "ISSUED"
    );

  const accepted =
    documents.filter(
      (document) =>
        document.acceptanceStatus ===
        "ACCEPTED"
    );

  const pending =
    documents.filter(
      (document) =>
        document.acceptanceStatus ===
        "PENDING"
    );

  const expired =
    documents.filter(
      (document) =>
        document.status === "EXPIRED"
    );

  const revoked =
    documents.filter(
      (document) =>
        document.status === "REVOKED"
    );

  const agreements =
    documents.filter(
      (document) =>
        document.type ===
        "AGREEMENT"
    );

  const kyc =
    documents.filter(
      (document) =>
        document.type === "KYC"
    );

  return {
    total:
      documents.length,

    issued:
      issued.length,

    accepted:
      accepted.length,

    pending:
      pending.length,

    expired:
      expired.length,

    revoked:
      revoked.length,

    agreements:
      agreements.length,

    kyc:
      kyc.length,
  };
}