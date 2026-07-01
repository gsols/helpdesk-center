package com.helpdeskcenter.services;

import com.ibm.watson.natural_language_understanding.v1.NaturalLanguageUnderstanding;
import com.ibm.watson.natural_language_understanding.v1.model.*;
import com.ibm.cloud.sdk.core.security.IamAuthenticator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AIService {

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
     * Calls Watson NLU and returns a preview map with:
     *   - watsonKeywords: list of {text, relevance, matchedCategory}
     *   - category: detected category or null if nothing matched
     *   - source: "watson" | "fallback" | "none"
     *   - allowed: true if a work-related category was found
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
                        String matched = null;
                        if (HARDWARE_KEYWORDS.stream().anyMatch(word::contains)) matched = "hardware";
                        else if (SOFTWARE_KEYWORDS.stream().anyMatch(word::contains)) matched = "software";
                        else if (HR_KEYWORDS.stream().anyMatch(word::contains))       matched = "hr";
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("text", kw.getText());
                        m.put("relevance", Math.round(kw.getRelevance() * 100));
                        m.put("matchedCategory", matched);
                        return m;
                    }).toList();

            // First matched keyword wins the category
            String category = kwList.stream()
                    .map(k -> (String) k.get("matchedCategory"))
                    .filter(c -> c != null)
                    .findFirst().orElse(null);

            result.put("source", "watson");
            result.put("watsonKeywords", kwList);
            result.put("category", category);
            result.put("allowed", category != null);
            return result;

        } catch (Exception e) {
            log.warn("[Watson NLU] preview() API failed, using fallback: {}", e.getMessage());
        }

        // Fallback: no Watson keywords, just tell UI which path ran
        String lower = text.toLowerCase();
        long hw = HARDWARE_KEYWORDS.stream().filter(lower::contains).count();
        long sw = SOFTWARE_KEYWORDS.stream().filter(lower::contains).count();
        long hr = HR_KEYWORDS.stream().filter(lower::contains).count();
        String fallbackCat = null;
        if (hw > 0 || sw > 0 || hr > 0) {
            if (hw >= sw && hw >= hr)      fallbackCat = "hardware";
            else if (sw >= hw && sw >= hr) fallbackCat = "software";
            else                           fallbackCat = "hr";
        }
        result.put("source", "fallback");
        result.put("watsonKeywords", Collections.emptyList());
        result.put("category", fallbackCat);
        result.put("allowed", fallbackCat != null);
        return result;
    }

    public String categorize(String text) {
        log.info("[Watson NLU] categorize() called with text: \"{}\"", text);
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
            log.info("[Watson NLU] API call succeeded. Keywords returned: {}",
                    results.getKeywords() == null ? "none" :
                    results.getKeywords().stream()
                           .map(k -> k.getText() + " (" + String.format("%.2f", k.getRelevance()) + ")")
                           .toList());

            // Check Watson keyword results for domain hints
            if (results.getKeywords() != null) {
                for (KeywordsResult kw : results.getKeywords()) {
                    String word = kw.getText().toLowerCase();
                    if (HARDWARE_KEYWORDS.stream().anyMatch(word::contains)) {
                        log.info("[Watson NLU] Matched HARDWARE via keyword: \"{}\"", kw.getText());
                        return "hardware";
                    }
                    if (SOFTWARE_KEYWORDS.stream().anyMatch(word::contains)) {
                        log.info("[Watson NLU] Matched SOFTWARE via keyword: \"{}\"", kw.getText());
                        return "software";
                    }
                    if (HR_KEYWORDS.stream().anyMatch(word::contains)) {
                        log.info("[Watson NLU] Matched HR via keyword: \"{}\"", kw.getText());
                        return "hr";
                    }
                }
            }
            log.warn("[Watson NLU] No keyword match found — falling back to local keyword scan");
        } catch (Exception e) {
            log.warn("[Watson NLU] API call FAILED — using keyword fallback. Reason: {}", e.getMessage());
        }

        String fallbackResult = keywordFallback(text);
        log.info("[Watson NLU] Fallback result: \"{}\"", fallbackResult);
        return fallbackResult;
    }

    private String keywordFallback(String text) {
        String lower = text.toLowerCase();
        long hw = HARDWARE_KEYWORDS.stream().filter(lower::contains).count();
        long sw = SOFTWARE_KEYWORDS.stream().filter(lower::contains).count();
        long hr = HR_KEYWORDS.stream().filter(lower::contains).count();

        if (hw >= sw && hw >= hr) return "hardware";
        if (sw >= hw && sw >= hr) return "software";
        if (hr > 0)               return "hr";
        return "software"; // default
    }
}
