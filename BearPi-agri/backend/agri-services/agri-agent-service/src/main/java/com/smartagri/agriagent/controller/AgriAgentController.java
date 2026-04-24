package com.smartagri.agriagent.controller;

import com.smartagri.agriagent.dto.AgriAgentChatRequest;
import com.smartagri.agriagent.dto.AgriAgentChatResponse;
import com.smartagri.agriagent.service.CozeAgentService;
import com.smartagri.agriagent.service.ImageStorageService;
import com.smartagri.common.model.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.file.Path;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/agri-agent")
public class AgriAgentController {

    private final CozeAgentService cozeAgentService;
    private final ImageStorageService imageStorageService;

    @PostMapping("/chat")
    public ApiResponse<AgriAgentChatResponse> chat(@Valid @RequestBody AgriAgentChatRequest request) {
        String answer = cozeAgentService.chat(request).block();
        return ApiResponse.success(new AgriAgentChatResponse(answer));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@Valid @RequestBody AgriAgentChatRequest request) {
        return toEmitter(cozeAgentService.streamChat(request));
    }

    @PostMapping(
            value = "/chat/stream/with-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamWithImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam("question") String question,
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "conversationId", required = false) String conversationId) {
        ImageStorageService.StoredImage stored = imageStorageService.store(image);
        AgriAgentChatRequest request = new AgriAgentChatRequest(question, userId, conversationId);
        return toEmitter(cozeAgentService.streamChatWithImage(request, stored.publicUrl()));
    }

    @GetMapping("/uploads/{date}/{filename:.+}")
    public ResponseEntity<Resource> upload(
            @PathVariable("date") String date,
            @PathVariable("filename") String filename) {
        Path path = imageStorageService.resolveUpload(date, filename);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imageStorageService.contentTypeFor(path)))
                .body(new FileSystemResource(path));
    }

    private SseEmitter toEmitter(Flux<CozeAgentService.AgentChunk> chunks) {
        SseEmitter emitter = new SseEmitter(0L);

        Disposable disposable = chunks
                .subscribe(chunk -> {
                    try {
                        switch (chunk.type()) {
                            case TOKEN -> emitter.send(SseEmitter.event().name("token").data(chunk.content()));
                            case THINKING -> emitter.send(SseEmitter.event().name("thinking").data(chunk.content()));
                            case CONTEXT -> emitter.send(SseEmitter.event().name("context").data(chunk.content()));
                            case DONE -> {
                                emitter.send(SseEmitter.event().name("done").data(chunk.content()));
                                emitter.complete();
                            }
                            case ERROR -> {
                                emitter.send(SseEmitter.event().name("error").data(chunk.content()));
                                emitter.complete();
                            }
                        }
                    } catch (IOException sendException) {
                        emitter.completeWithError(sendException);
                    }
                }, emitter::completeWithError, emitter::complete);

        emitter.onCompletion(disposable::dispose);
        emitter.onTimeout(() -> {
            disposable.dispose();
            emitter.complete();
        });

        return emitter;
    }
}
