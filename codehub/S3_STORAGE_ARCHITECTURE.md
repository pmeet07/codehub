# S3 Storage Architecture for CodeHub

## Overview
This document outlines the design for using AWS S3 as the primary storage backend for CodeHub, replacing the local filesystem storage while maintaining backward compatibility.

## 1. Bucket Structure
**Bucket Name**: `codehub-storage-<env>` (e.g., `codehub-storage-prod`)
**Region**: `us-east-1` (Configurable)

### Organization
The S3 bucket uses a prefix-based structure to isolate repositories and object types.

```
codehub-storage-prod/
└── repos/
    └── <repo-uuid>/
        ├── objects/           # Content-Addressable Storage
        │   ├── <hash1>        # Blob or Tree content (zlib compressed)
        │   ├── <hash2>
        │   └── ...
        ├── uploads/           # Temporary uploads (LFS support future-proof)
        └── refs/              # (Optional) Mirrors of refs for checking consistency
```

## 2. Object Storage Design (Git-like)
CodeHub uses a Content-Addressable Storage (CAS) model similar to Git.

-   **Blobs**: File contents.
-   **Trees**: Directory structures (JSON mapping of filename -> hash).
-   **Commits**: Metadata stored in PostgreSQL (for speed), but the `treeHash` points to a Tree object in S3.

### Workflow
1.  **Push**:
    -   Backend receives `objects` (blobs) and `commits`.
    -   Backend uploading `objects` to S3: `repos/<repoId>/objects/<hash>`.
    -   DB updates `Commits` and `Branches` tables.

2.  **Fetch / Read**:
    -   Backend resolves `branch` -> `commitHash` (DB).
    -   `commitHash` -> `treeHash` (DB).
    -   `treeHash` -> **Fetch Tree Object from S3**.
    -   Browser requests file content -> **Fetch Blob Object from S3**.

## 3. Backend Integration (Hybrid Fallback)
To ensure zero downtime migration:
-   **Writes**: Always write to S3.
-   **Reads**: Try S3 first. If 404, check local `storage/` folder (Legacy support).

## 4. Security & Performance
-   **Private Bucket**: All objects are private. Only the Backend IAM Role has `GetObject`/`PutObject` access.
-   **IAM Roles**: EC2 Instance Profile should be used instead of hardcoded keys in production.
-   **Caching**: Trees and Blobs are immutable. We can set `Cache-Control: public, max-age=31536000` on S3 objects.
-   **Compression**: All objects are zlib-compressed before upload to save bandwidth and storage cost.

## 5. Metadata Management
-   **PostgreSQL**: Stores the "Graph" (Commits, parents, branches, users).
-   **S3**: Stores the "Data" (File contents, directory listings).

This separation allows fast graph traversal (e.g., specialized SQL queries for history) without listing thousands of S3 files.

## 6. Scalability
-   **Pack Files**: Future optimization. Instead of 1000 small PUTs, bundle distinct objects into one PackFile on S3.
-   **CDN**: Serve raw content via CloudFront signed URLs for lower latency.
