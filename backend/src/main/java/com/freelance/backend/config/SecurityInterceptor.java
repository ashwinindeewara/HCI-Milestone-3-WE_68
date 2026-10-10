package com.freelance.backend.config;

import com.freelance.backend.repository.BlockedIpRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SecurityInterceptor implements HandlerInterceptor {

    @Autowired
    private BlockedIpRepository blockedIpRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        // Exempt health check endpoints & admin block management endpoints
        if (uri != null && (uri.equals("/") || uri.equals("/health") || uri.contains("/health") || uri.contains("/admin/security/block-ip") || uri.contains("/admin/security/blocked-ips"))) {
            return true;
        }

        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty()) {
            clientIp = request.getRemoteAddr();
        } else if (clientIp.contains(",")) {
            clientIp = clientIp.split(",")[0].trim();
        }

        if (clientIp != null && blockedIpRepository.existsByIpAddress(clientIp.trim())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Access Denied: Your IP address has been blocked by Security Administration.\"}");
            return false;
        }
        return true;
    }
}

