package com.helpdeskcenter.services;

import com.helpdeskcenter.dto.AiClassificationResult;
import com.ibm.watson.natural_language_understanding.v1.NaturalLanguageUnderstanding;
import com.ibm.watson.natural_language_understanding.v1.model.AnalysisResults;
import com.ibm.watson.natural_language_understanding.v1.model.AnalyzeOptions;
import com.ibm.watson.natural_language_understanding.v1.model.CategoriesOptions;
import com.ibm.watson.natural_language_understanding.v1.model.Features;
import com.ibm.watson.natural_language_understanding.v1.model.KeywordsOptions;
import com.ibm.watson.natural_language_understanding.v1.model.KeywordsResult;
import com.ibm.cloud.sdk.core.security.IamAuthenticator;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * IBM Watson NLU integration with 60% confidence threshold gate (ADR-0002).
 *
 * classify() returns Optional.empty() when:
 *   - confidence is below 60% (ticket goes to triage queue, department_id = null)
 *   - Watson call fails for any reason (safe fallback to triage)
 *
 * Every classify() call must be followed by a log entry in ai_classification_logs
 * (written by TicketService, not here, to maintain separation of concerns).
 */
@Service
@Slf4j
public class AIService {

    private static final double CONFIDENCE_THRESHOLD = 60.0;

    @Value("${watson.nlu.api-key}")
    private String apiKey;

    @Value("${watson.nlu.url}")
    private String serviceUrl;

    @Value("${watson.nlu.version}")
    private String version;

    private static final List<String> HARDWARE_KEYWORDS =
        List.of("keyboard", "laptop", "monitor", "printer", "mouse", "hardware",
                "screen", "headset", "cable", "battery", "charger", "computer", "device");

    private static final List<String> SOFTWARE_KEYWORDS =
        List.of("software", "application", "install", "update", "crash", "bug",
                "error", "login", "password", "access", "system", "windows", "browser");

    private static final List<String> HR_KEYWORDS =
        List.of("hr", "payroll", "leave", "vacation", "salary", "onboarding",
                "policy", "benefits", "training", "contract", "hire", "termination");

    /**
     * Classifies the given text and applies the 60% confidence gate.
     *
     * @return Optional containing the result if confidence >= 60%, or empty to signal triage.
     */
    public Optional<AiClassificationResult> classify(String text) {
        log.info("[AIService] classify() called");
        try {
            IamAuthenticator authenticator = new IamAuthenticator(apiKey);
            NaturalLanguageUnderstanding nlu = new NaturalLanguageUnderstanding(version, authenticator);
            nlu.setServiceUrl(serviceUrl);

            CategoriesOptions categories = new CategoriesOptions.Builder().limit(3).build();
            KeywordsOptions keywords = new KeywordsOptions.Builder().limit(5).build();
            Features features = new Features.Builder()
                .categories(categories)
                .keywords(keywords)
                .build();

            AnalyzeOptions options = new AnalyzeOptions.Builder()
                .text(text)
                .features(features)
                .build();

            AnalysisResults results = nlu.analyze(options).execute().getResult();

            if (results.getKeywords() != null) {
                for (KeywordsResult kw : results.getKeywords()) {
                    String word = kw.getText().toLowerCase();
                    double relevance = kw.getRelevance() * 100.0;
                    String category = matchCategory(word);

                    if (category != null) {
                        log.info("[AIService] Watson matched category '{}' with relevance {:.2f}%", category, relevance);
                        if (relevance >= CONFIDENCE_THRESHOLD) {
                            return Optional.of(new AiClassificationResult(
                                category,
                                BigDecimal.valueOf(relevance).setScale(2, java.math.RoundingMode.HALF_UP)
                            ));
                        } else {
                            log.info("[AIService] Confidence {:.2f}% below threshold — routing to triage", relevance);
                            return Optional.empty();
                        }
                    }
                }
            }
            log.warn("[AIService] No keyword matched — falling back to local keyword scan");
        } catch (Exception e) {
            log.warn("[AIService] Watson API failed — routing to triage. Reason: {}", e.getMessage());
            return Optional.empty();
        }

        // Watson returned results but no keyword matched our categories — use fallback with confidence
        return fallbackClassify(text);
    }

    /**
     * Returns a preview map for the UI — used by the ticket submission preview endpoint.
     * Does NOT apply the confidence gate (it shows raw info including confidence to the user).
     */
    public Map<String, Object> preview(String text) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            IamAuthenticator authenticator = new IamAuthenticator(apiKey);
            NaturalLanguageUnderstanding nlu = new NaturalLanguageUnderstanding(version, authenticator);
            nlu.setServiceUrl(serviceUrl);

            KeywordsOptions keywords = new KeywordsOptions.Builder().limit(5).build();
            Features features = new Features.Builder().keywords(keywords).build();
            AnalyzeOptions options = new AnalyzeOptions.Builder().text(text).features(features).build();

            AnalysisResults analysis = nlu.analyze(options).execute().getResult();

            List<Map<String, Object>> kwList = analysis.getKeywords() == null
                ? Collections.emptyList()
                : analysis.getKeywords().stream().map(kw -> {
                    String word = kw.getText().toLowerCase();
                    String matched = matchCategory(word);
                    double relevance = Math.round(kw.getRelevance() * 100);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("text", kw.getText());
                    m.put("relevance", relevance);
                    m.put("matchedCategory", matched);
                    return m;
                }).toList();

            String category = kwList.stream()
                .map(k -> (String) k.get("matchedCategory"))
                .filter(c -> c != null)
                .findFirst().orElse(null);

            double topConfidence = kwList.isEmpty() ? 0.0 : (double) kwList.get(0).get("relevance");

            result.put("source", "watson");
            result.put("watsonKeywords", kwList);
            result.put("category", category);
            result.put("confidence", topConfidence);
            result.put("allowed", category != null && topConfidence >= CONFIDENCE_THRESHOLD);
            return result;

        } catch (Exception e) {
            log.warn("[AIService] preview() Watson API failed, using fallback: {}", e.getMessage());
        }

        // Fallback
        String lower = text.toLowerCase();
        long hw = HARDWARE_KEYWORDS.stream().filter(lower::contains).count();
        long sw = SOFTWARE_KEYWORDS.stream().filter(lower::contains).count();
        long hr = HR_KEYWORDS.stream().filter(lower::contains).count();
        String fallbackCat = null;
        long maxCount = Math.max(hw, Math.max(sw, hr));
        if (maxCount > 0) {
            if (hw >= sw && hw >= hr)      fallbackCat = "hardware";
            else if (sw >= hw && sw >= hr) fallbackCat = "software";
            else                           fallbackCat = "hr";
        }
        // Fallback confidence is a rough heuristic (50% max — never clears the production gate)
        double fallbackConfidence = maxCount > 0 ? Math.min(maxCount * 15.0, 55.0) : 0.0;

        result.put("source", "fallback");
        result.put("watsonKeywords", Collections.emptyList());
        result.put("category", fallbackCat);
        result.put("confidence", fallbackConfidence);
        result.put("allowed", fallbackCat != null && fallbackConfidence >= CONFIDENCE_THRESHOLD);
        return result;
    }

    /**
     * Legacy method preserved for backward compatibility during transition.
     * Delegates to classify() and returns the category name or null.
     */
    public String categorize(String text) {
        return classify(text).map(AiClassificationResult::departmentName).orElse(null);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private Optional<AiClassificationResult> fallbackClassify(String text) {
        String lower = text.toLowerCase();
        long hw = HARDWARE_KEYWORDS.stream().filter(lower::contains).count();
        long sw = SOFTWARE_KEYWORDS.stream().filter(lower::contains).count();
        long hr = HR_KEYWORDS.stream().filter(lower::contains).count();
        long max = Math.max(hw, Math.max(sw, hr));

        if (max == 0) return Optional.empty();

        String category;
        if (hw >= sw && hw >= hr)      category = "hardware";
        else if (sw >= hw && sw >= hr) category = "software";
        else                           category = "hr";

        // Fallback confidence is capped at 55% — always below production threshold
        double confidence = Math.min(max * 15.0, 55.0);
        log.info("[AIService] Fallback matched '{}' with {:.1f}% — below threshold, routing to triage", category, confidence);
        // Always returns empty because fallback can't clear the 60% gate
        return Optional.empty();
    }

    private String matchCategory(String word) {
        if (HARDWARE_KEYWORDS.stream().anyMatch(word::contains)) return "hardware";
        if (SOFTWARE_KEYWORDS.stream().anyMatch(word::contains)) return "software";
        if (HR_KEYWORDS.stream().anyMatch(word::contains))       return "hr";
        return null;
    }
}
