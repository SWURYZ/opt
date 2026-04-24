package com.smartagri.agriagent.service;

import com.smartagri.agriagent.config.AgriAgentUploadProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private static final DateTimeFormatter DATE_DIR = DateTimeFormatter.BASIC_ISO_DATE;

    private final AgriAgentUploadProperties properties;

    public StoredImage store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请选择要上传的图片");
        }
        if (file.getSize() > properties.getMaxSizeBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "图片不能超过10MB");
        }

        String detectedType = detectContentType(file);
        if (!properties.getAllowedContentTypes().contains(detectedType)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "仅支持 JPG、PNG、WebP、GIF 图片");
        }

        String date = LocalDate.now().format(DATE_DIR);
        String filename = UUID.randomUUID() + extensionFor(detectedType);
        Path root = uploadRoot();
        Path dir = root.resolve(date).normalize();
        Path target = dir.resolve(filename).normalize();
        if (!target.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "图片路径不合法");
        }

        try {
            Files.createDirectories(dir);
            file.transferTo(target);
        } catch (IOException err) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "图片保存失败", err);
        }

        String publicUrl = publicUrl(date, filename);
        return new StoredImage(date, filename, target, publicUrl, detectedType, file.getSize());
    }

    public Path resolveUpload(String date, String filename) {
        if (!date.matches("\\d{8}") || filename.contains("/") || filename.contains("\\\\")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Path root = uploadRoot();
        Path target = root.resolve(date).resolve(filename).normalize();
        if (!target.startsWith(root) || !Files.isRegularFile(target)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return target;
    }

    public String contentTypeFor(Path path) {
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".gif")) return "image/gif";
        return "application/octet-stream";
    }

    private Path uploadRoot() {
        return Path.of(properties.getDir()).toAbsolutePath().normalize();
    }

    private String publicUrl(String date, String filename) {
        String base = stripTrailingSlash(properties.getPublicBaseUrl());
        String path = properties.getPublicPath().startsWith("/") ? properties.getPublicPath() : "/" + properties.getPublicPath();
        return base + stripTrailingSlash(path) + "/" + date + "/" + filename;
    }

    private String detectContentType(MultipartFile file) {
        byte[] header = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.read(header);
        } catch (IOException err) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "图片读取失败", err);
        }

        String declared = StringUtils.hasText(file.getContentType()) ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        String detected = detectByMagic(header, Math.max(read, 0));
        if (detected == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "图片格式不支持");
        }
        if (StringUtils.hasText(declared) && !declared.equals(detected) && !(declared.equals("image/jpg") && detected.equals("image/jpeg"))) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "图片格式与文件内容不一致");
        }
        return detected;
    }

    private String detectByMagic(byte[] header, int read) {
        if (read >= 3 && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8 && (header[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (read >= 8 && HexFormat.of().formatHex(header, 0, 8).equals("89504e470d0a1a0a")) {
            return "image/png";
        }
        if (read >= 6) {
            String gif = new String(header, 0, 6);
            if (gif.equals("GIF87a") || gif.equals("GIF89a")) return "image/gif";
        }
        if (read >= 12) {
            String riff = new String(header, 0, 4);
            String webp = new String(header, 8, 4);
            if (riff.equals("RIFF") && webp.equals("WEBP")) return "image/webp";
        }
        return null;
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".img";
        };
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public record StoredImage(String date, String filename, Path path, String publicUrl, String contentType, long size) {
    }
}
