package com.proyect.main.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class GcsConfig {

    @Value("${gcp.credentials-path:classpath:gcs-key.json}")
    private Resource credentialsResource;

    @Value("${gcp.credentials-json:}")
    private String credentialsJson;

    @Value("${gcp.project-id}")
    private String projectId;

    @Bean
    public Storage storage() throws IOException {
        StorageOptions.Builder builder = StorageOptions.newBuilder().setProjectId(projectId);
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            try (InputStream is = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))) {
                builder.setCredentials(GoogleCredentials.fromStream(is));
            }
        } else if (credentialsResource != null && credentialsResource.exists()) {
            try (InputStream is = credentialsResource.getInputStream()) {
                builder.setCredentials(GoogleCredentials.fromStream(is));
            }
        }
        return builder.build().getService();
    }
}
