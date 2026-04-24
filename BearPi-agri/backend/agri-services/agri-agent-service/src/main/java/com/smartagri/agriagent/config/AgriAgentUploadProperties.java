package com.smartagri.agriagent.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "agri-agent.uploads")
public class AgriAgentUploadProperties {

    private String dir = "data/agri-agent/uploads";
    private String publicBaseUrl = "http://139.155.96.142:8085";
    private String publicPath = "/api/v1/agri-agent/uploads";
    private long maxSizeBytes = 10 * 1024 * 1024;
    private List<String> allowedContentTypes = List.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif");
}
