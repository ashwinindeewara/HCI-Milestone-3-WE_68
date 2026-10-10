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
        // 1. Always allow CORS pre-flight OPTIONS requests to pass through immediately
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        String uri = request.getRequestURI();
        // 2. Exempt public routes (auth endpoints, health checks, root) & admin block management
        if (uri != null && (
                uri.equals("/") || 
                uri.equals("/health") || 
                uri.contains("/health") || 
                uri.contains("/auth") || 
                uri.contains("/admin/security/block-ip") || 
                uri.contains("/admin/security/blocked-ips")
        )) {
            return true;
        }

        // 3. Extract client IP address from proxy headers (X-Forwarded-For) or remote address
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty()) {
            clientIp = request.getRemoteAddr();
        } else if (clientIp.contains(",")) {
            clientIp = clientIp.split(",")[0].trim();
        }

        // 4. Safely query blocked IP database repository without blocking traffic on DB errors
        try {
            if (clientIp != null && blockedIpRepository.existsByIpAddress(clientIp.trim())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Access Denied: Your IP address has been blocked by Security Administration.\"}");
                return false;
            }
        } catch (Exception e) {
            System.err.println("[SECURITY INTERCEPTOR] Warning: Failed to query blocked IP database: " + e.getMessage());
        }

        return true;
    }
}

