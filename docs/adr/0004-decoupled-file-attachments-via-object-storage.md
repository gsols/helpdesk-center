# ADR 0004: Decoupled File Attachments via Object Storage

## Status
Accepted

## Context

The platform must support file attachments in two places:

- during initial ticket submission,
- and during later conversation exchanges between employees and agents.

The blueprint explicitly states that binary payloads must never be stored directly in PostgreSQL as database BLOB-style content. Instead, files must be uploaded to an object storage service such as AWS S3, Google Cloud Storage, or MinIO, while PostgreSQL retains only attachment metadata and a secure retrieval locator.

The schema reflects this design in [`attachments`](schema.sql:73), which stores:

- the parent ticket via [`ticket_id`](schema.sql:75),
- the related conversation message via [`message_id`](schema.sql:76),
- file name, type, and size via [`file_name`](schema.sql:77), [`file_type`](schema.sql:78), and [`file_size`](schema.sql:79),
- and the object-storage locator via [`secure_url`](schema.sql:80).

The schema comment on [`message_id`](schema.sql:76) clarifies that it is null when the file is added during initial ticket creation. This supports both creation-time and message-time attachment flows.

Because the application is a ticketing system with relational search and reporting needs, metadata belongs in PostgreSQL, but raw file bodies do not. Storing binary data inside the relational database would increase table size, degrade backup and restore efficiency, and negatively affect performance for transactional ticket operations.

## Decision

We will keep binary attachment payloads out of PostgreSQL and store them in an external object storage provider such as AWS S3 or MinIO. PostgreSQL will store only attachment metadata and the secure object locator string in [`attachments.secure_url`](schema.sql:80).

The upload flow will be decoupled from relational persistence:

1. the client submits a file,
2. the backend uploads the binary stream to object storage,
3. the backend persists attachment metadata in [`attachments`](schema.sql:73),
4. the attachment row links the file to either:
   - the parent ticket via [`attachments.ticket_id`](schema.sql:75), or
   - a later discussion item via [`attachments.message_id`](schema.sql:76).

This dual-link model supports both attachment scopes required by the blueprint:

- initial ticket creation attachments associated with the ticket itself,
- and subsequent conversational attachments associated with the evolving [`ticket_messages`](schema.sql:61) stream.

We will treat [`attachments`](schema.sql:73) as a metadata bridge table between the relational ticketing model and external object storage. The database remains responsible for referential context and queryability, while the storage provider remains responsible for binary durability and delivery.

## Alternatives Considered

### 1. Store binary files directly in PostgreSQL
This was explicitly rejected by the blueprint. Large binary payloads would inflate the database, slow backups, increase replication overhead, and degrade the performance profile of the ticketing system.

### 2. Store files only on local application disk
This was rejected because local disk storage is harder to scale, less durable across deployments, and poorly suited to containerized or distributed environments.

### 3. Store only ticket-level attachments and not message-level attachments
This would simplify the schema, but it would fail to support the required conversational workflow where users attach files during later back-and-forth replies.

### 4. Use a separate attachment table for ticket creation files and message files
This was rejected as unnecessary duplication. A single [`attachments`](schema.sql:73) table with nullable [`message_id`](schema.sql:76) cleanly supports both cases.

### 5. Persist public file URLs without a secure locator strategy
This was rejected because attachments may contain sensitive company data. The schema’s [`secure_url`](schema.sql:80) field supports controlled retrieval patterns rather than assuming public exposure.

## Consequences

### Positive
- PostgreSQL remains optimized for transactional and relational workloads rather than binary storage.
- Backups, restores, and replication remain smaller and faster than they would with in-database file payloads.
- Object storage services provide a scalable and durable home for uploaded files.
- The schema supports both initial ticket attachments and later conversation attachments.
- Metadata remains queryable in SQL for auditing, validation, and UI rendering.

### Negative
- The platform now depends on a separate storage service in addition to PostgreSQL.
- Upload workflows require coordination between binary storage and relational metadata persistence.
- Orphan cleanup and consistency checks may be needed if storage and database operations ever diverge.

### Operational Implications
- Attachment creation should be transactional from the application perspective, even though storage and database persistence occur across different systems.
- Authorization checks for file retrieval must be derived from the linked ticket or message context, not just possession of the URL.
- Validation should use metadata fields such as [`file_type`](schema.sql:78) and [`file_size`](schema.sql:79) before accepting uploads.
- Cascading deletes on [`attachments.ticket_id`](schema.sql:75) and [`attachments.message_id`](schema.sql:76) remove metadata rows automatically, but object storage cleanup must also be handled by application workflows or background jobs.
