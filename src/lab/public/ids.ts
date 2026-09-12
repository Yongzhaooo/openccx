import { domainHash, jcsStringify } from "../digest";

export type PublicEvidenceIdKind =
  | "subject"
  | "record"
  | "bundle"
  | "bundle_digest"
  | "artifact"
  | "publisher_key"
  | "revocation"
  | "route_registry";

const PUBLIC_EVIDENCE_DOMAIN: Record<PublicEvidenceIdKind, string> = {
  subject: "occx-lab-public:subject:v1",
  record: "occx-lab-public:record:v1",
  bundle: "occx-lab-public:bundle:v1",
  bundle_digest: "occx-lab-public:bundle-digest:v1",
  artifact: "occx-lab-public:artifact:v1",
  publisher_key: "occx-lab-public:publisher-key:v1",
  revocation: "occx-lab-public:revocation:v1",
  route_registry: "occx-lab-public:route-registry:v1",
};

export function publicEvidenceId(kind: PublicEvidenceIdKind, payload: unknown): string {
  return domainHash(PUBLIC_EVIDENCE_DOMAIN[kind], jcsStringify(payload));
}
