package com.helpdeskcenter.services;

import com.ibm.watson.natural_language_understanding.v1.NaturalLanguageUnderstanding;
import com.ibm.watson.natural_language_understanding.v1.model.*;
import com.ibm.cloud.sdk.core.security.IamAuthenticator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public String categorize(String text) {
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

            // Check Watson keyword results for domain hints
            if (results.getKeywords() != null) {
                for (KeywordsResult kw : results.getKeywords()) {
                    String word = kw.getText().toLowerCase();
                    if (HARDWARE_KEYWORDS.stream().anyMatch(word::contains)) return "hardware";
                    if (SOFTWARE_KEYWORDS.stream().anyMatch(word::contains)) return "software";
                    if (HR_KEYWORDS.stream().anyMatch(word::contains))       return "hr";
                }
            }
        } catch (Exception e) {
            log.warn("Watson NLU failed, using keyword fallback: {}", e.getMessage());
        }

        return keywordFallback(text);
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
