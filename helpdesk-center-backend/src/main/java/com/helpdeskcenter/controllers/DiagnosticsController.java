package com.helpdeskcenter.controllers;

import com.ibm.watson.natural_language_understanding.v1.NaturalLanguageUnderstanding;
import com.ibm.watson.natural_language_understanding.v1.model.*;
import com.ibm.cloud.sdk.core.security.IamAuthenticator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class DiagnosticsController {

    @Value("${watson.nlu.api-key}")
    private String apiKey;

    @Value("${watson.nlu.url}")
    private String serviceUrl;

    @Value("${watson.nlu.version}")
    private String version;

    @GetMapping("/watson")
    public ResponseEntity<Map<String, Object>> testWatson() {
        Map<String, Object> result = new LinkedHashMap<>();

        // Check if key is still placeholder
        if (apiKey.equals("YOUR_WATSON_API_KEY_HERE") || apiKey.isBlank()) {
            result.put("status",  "FAILED");
            result.put("reason",  "API key is still the placeholder value");
            result.put("action",  "Paste your real Watson NLU API key into application.properties line 22");
            return ResponseEntity.status(503).body(result);
        }

        result.put("apiKeyConfigured", true);
        result.put("url", serviceUrl);
        result.put("version", version);

        try {
            IamAuthenticator authenticator = new IamAuthenticator(apiKey);
            NaturalLanguageUnderstanding nlu = new NaturalLanguageUnderstanding(version, authenticator);
            nlu.setServiceUrl(serviceUrl);

            // Test with a known hardware sentence
            String testText = "My laptop keyboard is broken and I cannot type anything";

            KeywordsOptions keywords = new KeywordsOptions.Builder().limit(3).build();
            Features features = new Features.Builder().keywords(keywords).build();
            AnalyzeOptions options = new AnalyzeOptions.Builder()
                    .text(testText)
                    .features(features)
                    .build();

            AnalysisResults analysis = nlu.analyze(options).execute().getResult();

            result.put("status",       "OK");
            result.put("message",      "Watson NLU is connected and responding");
            result.put("testInput",    testText);
            result.put("watsonKeywords",
                    analysis.getKeywords().stream()
                            .map(k -> k.getText() + " (" + String.format("%.2f", k.getRelevance()) + ")")
                            .toList());

        } catch (Exception e) {
            result.put("status",  "FAILED");
            result.put("reason",  e.getMessage());
            result.put("action",  "Check your API key and URL region in application.properties");
        }

        return ResponseEntity.ok(result);
    }
}
