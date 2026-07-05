# ADR 0002: IBM watsonx Routing and Fallback Confidence Gates

## Status
Accepted

## Context

A central product differentiator of the platform is automated ticket triage using IBM watsonx.ai. The blueprint requires the system to extract intent from ticket text, predict a department, and return a numerical confidence score from 0.00 to 100.00. This AI output directly influences how new tickets enter operational queues.

However, the blueprint also establishes a hard business safeguard: if confidence falls below 60.00%, or if the classification service fails unexpectedly, the ticket must not be force-routed into a potentially incorrect department. Instead, it must enter a supervised global triage flow where human reviewers can clarify or manually assign the issue.

This requirement is reflected structurally in [`tickets.department_id`](schema.sql:48), which is nullable and documented in the schema as meaning the “Uncategorized” queue when null. This is not an accidental relaxation of integrity; it is a deliberate modeling choice for fallback routing.

The blueprint also requires feedback capture when AI predictions prove wrong. When an agent reroutes a misclassified ticket, the platform must store that event as training data for future model improvement. The schema implements this through [`ai_classification_logs`](schema.sql:84), which captures:

- the original text via [`raw_text`](schema.sql:87),
- the model’s predicted department via [`predicted_department_id`](schema.sql:88),
- the corrected department via [`actual_department_id`](schema.sql:89),
- the score via [`confidence_score`](schema.sql:90),
- and whether the result was wrong via [`is_misclassified`](schema.sql:91).

The business model therefore requires both automated routing and deliberate uncertainty handling, with an auditable retraining loop.

## Decision

We will integrate IBM watsonx.ai as the primary automated ticket classification engine and enforce a fixed 60.00% confidence threshold for production routing decisions.

When the AI classification response returns a confidence score greater than or equal to 60.00%, the system may assign the predicted department to the ticket. When the score is below 60.00%, or when the classification request fails due to timeout, network error, service disruption, or invalid response, the system will create or update the ticket with [`tickets.department_id`](schema.sql:48) set to null.

In this architecture, null in [`tickets.department_id`](schema.sql:48) is an intentional domain signal meaning “Uncategorized/Triage Queue.” We explicitly accept nullable department assignment because uncertainty is a valid operational state, not bad data. This enables human triage managers or system administrators to review ambiguous issues safely before exposing them to a departmental queue.

We will also use [`ai_classification_logs`](schema.sql:84) as the canonical feedback dataset for model evaluation and retraining preparation. Every reroute action caused by AI misclassification will write a log entry that preserves both the original prediction and the corrected destination. This table is not just an audit trail; it is the platform’s learning loop for improving future classification quality.

The resulting policy is:

- AI routes only when sufficiently confident.
- Uncertain or failed classifications default to human-supervised triage.
- Misroutes generate structured feedback data for retraining and performance analysis.

## Alternatives Considered

### 1. Always force a department assignment, even below 60%
This was rejected because it increases the chance of routing sensitive or irrelevant tickets into the wrong departmental queue. The blueprint prioritizes safe handling over aggressive automation.

### 2. Use a higher threshold such as 75% or 80%
This would reduce misclassification risk but would also send too many tickets into manual triage, weakening the operational value of AI-assisted routing. The 60.00% threshold is the explicitly approved business boundary.

### 3. Use a lower threshold such as 50%
This would maximize automation volume but increase incorrect routing and cross-team noise. Given the platform’s privacy and departmental isolation rules, this was not acceptable.

### 4. Create a dedicated “Uncategorized” department row instead of using null
This was rejected because it conflates “not yet classified” with “classified to a real department.” Null is semantically cleaner here: it explicitly represents the absence of a department decision. It also aligns directly with the blueprint requirement that `department_id = NULL` signals the triage queue.

### 5. Store AI logs only for failed or low-confidence predictions
This would reduce storage volume but weaken later analytics and model evaluation. The approved schema supports broader logging so the system can compare predicted versus actual outcomes over time.

## Consequences

### Positive
- The system has a clear, deterministic production rule for AI routing.
- Nullability of [`tickets.department_id`](schema.sql:48) accurately models uncertainty and supervised triage.
- Sensitive tickets are less likely to be exposed to the wrong department.
- [`ai_classification_logs`](schema.sql:84) creates a durable feedback loop for retraining and accuracy measurement.
- The design supports operational metrics such as classification accuracy and reroute frequency.

### Negative
- Some tickets will require manual review, which introduces human workload.
- Null department handling must be consistently supported in backend queries, permissions, and UI states.
- AI logging introduces additional storage and operational review requirements.

### Operational Implications
- Routing services must treat confidence threshold evaluation as mandatory logic, not optional tuning.
- Queue views and authorization rules must explicitly support uncategorized tickets where [`department_id`](schema.sql:48) is null.
- Reroute workflows must write complete records into [`ai_classification_logs`](schema.sql:84) to preserve retraining value.
- Analytics should use fields such as [`confidence_score`](schema.sql:90) and [`is_misclassified`](schema.sql:91) to monitor model quality over time.
