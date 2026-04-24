package com.smartagri.agriagent.dto;

import jakarta.validation.constraints.NotBlank;

public record AgriAgentChatRequest(
        @NotBlank(message = "question cannot be blank") String question,
        String userId,
        String conversationId,
        String fileId,
        String imageUrl
) {
    public AgriAgentChatRequest withoutFile() {
        return new AgriAgentChatRequest(question, userId, conversationId, null, null);
    }

    public AgriAgentChatRequest withImageUrl(String imageUrl) {
        return new AgriAgentChatRequest(question, userId, conversationId, null, imageUrl);
    }
}
